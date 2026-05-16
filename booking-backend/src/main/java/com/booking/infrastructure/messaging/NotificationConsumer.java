package com.booking.infrastructure.messaging;

import com.booking.config.RabbitMQConfig;
import com.booking.domain.booking.event.BookingCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumer cho booking notifications. Phase này log ra console.
 * Production: gửi email qua SendGrid / SES, push notification, SMS, v.v.
 *
 * 📚 Vì sao tách consumer khỏi business logic?
 *   - Business logic không quan tâm "gửi email mất 500ms hay 3s" — async.
 *   - Có thể scale consumer độc lập (nhiều worker cùng đọc queue).
 *   - Nếu email service down → message giữ trong queue, retry sau, không
 *     block luồng đặt phòng.
 */
@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NOTIFICATIONS)
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("📧 [NOTIFICATION] Booking confirmed → user={}, room={}, dates={}→{}, total={}đ",
                event.userId(),
                event.roomId(),
                event.checkIn(),
                event.checkOut(),
                event.totalPrice());

        // Giả lập latency của email service
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
