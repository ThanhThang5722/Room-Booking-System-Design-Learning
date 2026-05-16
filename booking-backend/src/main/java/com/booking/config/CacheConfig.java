package com.booking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Spring Cache abstraction backed by Redis.
 *
 * Vì sao dùng abstraction thay vì RedisTemplate trực tiếp?
 *   - @Cacheable trên service method → cleaner code, không lẫn logic.
 *   - Dễ swap backend (Caffeine in-memory cho test, Redis cho prod) không
 *     phải sửa business code.
 *
 * Trade-off cache invalidation: cache TTL = 60s → sau khi 1 booking confirm,
 * search "available" có thể còn thấy phòng đó trong tối đa 60s (eventual consistency).
 * Acceptable cho UC này; production tốt hơn là invalidate khi BookingCreatedEvent fire.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_AVAILABLE_ROOMS = "rooms:available";

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory,
                                          ObjectMapper objectMapper) {
        RedisCacheConfiguration baseConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(60))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(baseConfig)
                .build();
    }
}
