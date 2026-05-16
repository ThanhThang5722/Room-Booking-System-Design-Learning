package com.booking.infrastructure.redis;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * LAYER 1 trong concurrent booking: Redis Distributed Lock.
 *
 * Cơ chế:
 *   1. acquire(): SET key {requestId} NX PX 10000
 *        - NX = set chỉ khi key chưa tồn tại (atomic)
 *        - PX = TTL theo millisecond → tự nhả lock nếu app crash
 *   2. release(): Lua script — chỉ xóa nếu value vẫn là requestId của mình
 *
 * 📚 Vì sao đặt lock ở Redis mà không lock thẳng DB?
 *   - Redis nhanh hơn DB ~10x → reject sớm các request thừa, giảm tải DB.
 *   - Nếu chỉ dùng DB lock: traffic spike → connection pool cạn → toàn bộ
 *     hệ thống chậm theo. Redis lock là "circuit breaker" cấp 1.
 */
@Service
public class RedisLockService {

    private static final Logger log = LoggerFactory.getLogger(RedisLockService.class);

    private final RedisTemplate<String, String> redisTemplate;
    private final DefaultRedisScript<Long> unlockScript;

    public RedisLockService(RedisTemplate<String, String> redisTemplate,
                            DefaultRedisScript<Long> unlockScript) {
        this.redisTemplate = redisTemplate;
        this.unlockScript = unlockScript;
    }

    /**
     * Cố gắng acquire lock.
     * @return requestId (UUID) nếu thành công, null nếu lock đang được giữ.
     *         Caller phải truyền lại requestId này khi release để Lua script verify.
     */
    public String tryAcquire(String key, Duration ttl) {
        String requestId = UUID.randomUUID().toString();
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(key, requestId, ttl);

        if (Boolean.TRUE.equals(acquired)) {
            log.debug("Acquired lock: key={}, requestId={}, ttl={}ms",
                    key, requestId, ttl.toMillis());
            return requestId;
        }

        log.debug("Failed to acquire lock (already held): key={}", key);
        return null;
    }

    /**
     * Release lock một cách an toàn — Lua script đảm bảo chỉ owner mới xóa được.
     *
     * Nếu requestId không khớp (vì lock đã expire và bị thread khác chiếm),
     * script return 0 → không xóa nhầm.
     */
    public boolean release(String key, String requestId) {
        if (requestId == null) {
            return false;
        }
        Long result = redisTemplate.execute(
                unlockScript,
                List.of(key),
                requestId
        );
        boolean released = result != null && result == 1L;
        if (!released) {
            // Đây là dấu hiệu: lock đã expire trước khi caller release → cần
            // tăng TTL hoặc tối ưu transaction cho nhanh hơn.
            log.warn("Failed to release lock (already expired?): key={}, requestId={}",
                    key, requestId);
        }
        return released;
    }
}
