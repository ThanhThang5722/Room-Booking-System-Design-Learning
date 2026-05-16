package com.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /**
     * RedisTemplate<String, String> để key và value đều là plain string —
     * tránh việc Spring tự serialize bằng JDK (binary, khó debug từ redis-cli).
     */
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        StringRedisSerializer ser = new StringRedisSerializer();
        template.setKeySerializer(ser);
        template.setValueSerializer(ser);
        template.setHashKeySerializer(ser);
        template.setHashValueSerializer(ser);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Lua script atomic release lock.
     *
     * KEYS[1] = lock key
     * ARGV[1] = requestId (UUID của request đang giữ lock)
     *
     * 📚 Vì sao phải Lua script?
     *  - Nếu làm 2 bước riêng (GET key → so sánh → DEL key), giữa 2 bước
     *    có thể xảy ra:
     *      Thread A: GET → đúng giá trị
     *      Thread B (lock đã hết TTL): SET → chiếm lock
     *      Thread A: DEL → xóa nhầm lock của B!
     *  - Lua chạy ATOMIC trong Redis → so sánh và xóa trong 1 lệnh.
     */
    @Bean
    public DefaultRedisScript<Long> unlockScript() {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText("""
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
                """);
        script.setResultType(Long.class);
        return script;
    }
}
