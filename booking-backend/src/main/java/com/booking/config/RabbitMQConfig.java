package com.booking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "booking.events";
    public static final String QUEUE_NOTIFICATIONS = "booking.notifications";
    public static final String ROUTING_BOOKING_CREATED = "booking.created";

    /**
     * Topic exchange — routing key có thể dùng wildcard (booking.*).
     * Tương lai có thể thêm routing.payment, routing.cancelled, v.v.
     */
    @Bean
    public TopicExchange bookingExchange() {
        return new TopicExchange(EXCHANGE, /*durable*/ true, /*autoDelete*/ false);
    }

    /**
     * Queue durable → message giữ lại khi RabbitMQ restart.
     * DLQ (dead-letter queue) chưa cấu hình — sẽ thêm khi nhu cầu production rõ hơn.
     */
    @Bean
    public Queue notificationsQueue() {
        return QueueBuilder.durable(QUEUE_NOTIFICATIONS).build();
    }

    @Bean
    public Binding notificationsBinding(Queue notificationsQueue, TopicExchange bookingExchange) {
        return BindingBuilder.bind(notificationsQueue)
                .to(bookingExchange)
                .with(ROUTING_BOOKING_CREATED);
    }

    /**
     * Mặc định Spring AMQP dùng SimpleMessageConverter (Java serialization).
     * Đổi sang JSON để: dễ debug, ngôn ngữ-agnostic (consumer có thể là Node/Python),
     * tránh ràng buộc class path giữa publisher và consumer.
     */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
