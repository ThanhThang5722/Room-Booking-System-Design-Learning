package com.booking.infrastructure.messaging;

import com.booking.config.RabbitMQConfig;
import com.booking.domain.booking.event.BookingCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Bắt domain event (Spring application event) AFTER_COMMIT và forward sang RabbitMQ.
 *
 * 📚 Vì sao @TransactionalEventListener thay vì @EventListener thường?
 *   - @EventListener: chạy NGAY khi publishEvent() được gọi, trong cùng transaction.
 *     Nếu transaction rollback sau đó → event đã gửi → ghost event.
 *   - @TransactionalEventListener(AFTER_COMMIT): chỉ chạy sau khi commit thành công.
 *     Nếu rollback → event bị Spring drop, không tới được Rabbit. AN TOÀN.
 *
 * 📚 Pattern này còn gọi là "transactional outbox lite" — chuẩn production
 *   sẽ lưu event vào bảng outbox trong cùng transaction, rồi poller forward
 *   sang queue. Khi cần "at-least-once delivery guarantee", hãy refactor sang đó.
 */
@Component
public class BookingEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(BookingEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public BookingEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCreated(BookingCreatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.ROUTING_BOOKING_CREATED,
                    event
            );
            log.debug("Published BookingCreatedEvent to RabbitMQ: bookingId={}", event.bookingId());
        } catch (Exception ex) {
            // Nếu Rabbit down, KHÔNG throw — booking đã commit thành công,
            // không thể rollback. Production sẽ retry qua outbox pattern.
            log.error("Failed to publish BookingCreatedEvent (rabbit down?): bookingId={}",
                    event.bookingId(), ex);
        }
    }
}
