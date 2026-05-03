import { Module } from '@nestjs/common';
import { NotificationProcessorService } from './notification-processor.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessorService],
  exports: [NotificationService],
})
export class NotificationModule {}
