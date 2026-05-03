import { Injectable, Logger } from '@nestjs/common';
import { NotificationEvent } from '../prisma/generated/client';
import { EventStatus } from '../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseException } from '../shared/app.exceptions';
import {
  DEFAULT_PRIORITY,
  EVENT_PRIORITY_MAP,
} from './enums/event-priority.map';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationMessageFactory } from './notification-message.factory';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationDeliveryService: NotificationDeliveryService,
  ) {}

  async processEvent(eventId: string): Promise<void> {
    const event = await this.prisma.notificationEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new DatabaseException(
        `Notification event with ID ${eventId} not found.`,
      );
    }
    if (event.status !== EventStatus.RECEIVED) {
      this.logger.warn(`Skipping event ${eventId} with status ${event.status}`);
      return;
    }
    // validations
    if (!event.userId && !event.email && !event.phone) {
      await this.markEventAsFailed(
        eventId,
        new Error(
          'Event must have at least one contact method (userId, email, or phone)',
        ),
      );
      return;
    }
    // Decision Layer
    const shouldSend = this.shouldSend(event);
    const priority = EVENT_PRIORITY_MAP[event.eventType] ?? DEFAULT_PRIORITY;

    const message = NotificationMessageFactory.build(event);

    try {
      let notificationId: string | undefined;
      await this.prisma.$transaction(async (tx) => {
        const results = await tx.notificationEvent.updateMany({
          where: {
            id: eventId,
            status: EventStatus.RECEIVED,
          },
          data: {
            status: EventStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
        if (results.count === 0) {
          this.logger.warn(
            `Event ${eventId} was already processed by another worker.`,
          );
          return;
        }
        if (shouldSend) {
          const notification = await tx.notification.create({
            data: {
              userId: event.userId!,
              eventId: event.id,
              priority,
              message,
            },
          });
          notificationId = notification.id;
        }
      });
      if (notificationId) {
        await this.notificationDeliveryService.createDeliveriesForNotification(
          notificationId,
        );
      }
      this.logger.log(
        `Successfully processed event ${eventId} with priority ${priority}`,
      );
    } catch (error) {
      await this.markEventAsFailed(eventId, error as Error);
      throw error;
    }
  }
  async markEventAsProcessed(eventId: string): Promise<void> {
    await this.prisma.notificationEvent.update({
      where: { id: eventId },
      data: {
        status: EventStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  }
  async markEventAsFailed(eventId: string, error: Error): Promise<void> {
    this.logger.error(
      `Failed to process event ${eventId}: ${error.message}`,
      error.stack,
    );
    await this.prisma.notificationEvent.update({
      where: { id: eventId },
      data: {
        status: EventStatus.FAILED,
        processedAt: new Date(),
        failureReason: error instanceof Error ? error.message : String(error),
      },
    });
  }
  private shouldSend(event: NotificationEvent): boolean {
    switch (event.eventType) {
      case 'USER_LOGIN':
        return false;
      default:
        return true;
    }
  }
}
