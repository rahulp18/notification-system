import { Module } from '@nestjs/common';
import { DeliveryWorkerService } from './delivery-worker.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationProcessorService,
    NotificationDeliveryService,
    DeliveryWorkerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
