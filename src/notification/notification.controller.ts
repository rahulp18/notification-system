import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NotificationEvent } from '../prisma/generated/client';
import { CreateNotificationEventDto } from './dto/create-notification-event.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('event')
  @HttpCode(HttpStatus.CREATED)
  async createNotificationEvent(
    @Body() createEventDTO: CreateNotificationEventDto,
  ): Promise<NotificationEvent> {
    return await this.notificationService.createNotificationEvent(
      createEventDTO,
    );
  }
}
