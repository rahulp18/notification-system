import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '../prisma/generated/client';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, DatabaseException } from '../shared/app.exceptions';
import { CreateNotificationEventDto } from './dto/create-notification-event.dto';
import { NotificationProcessorService } from './notification-processor.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationProcessor: NotificationProcessorService,
  ) {}
  private generateIdempotencyKey(
    userId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): string {
    const content = JSON.stringify({ userId, eventType, payload });
    return createHash('sha256').update(content).digest('hex');
  }
  async createNotificationEvent(
    createEventDTO: CreateNotificationEventDto,
  ): Promise<NotificationEvent> {
    const { userId, eventType, email, metadata, phone } = createEventDTO;
    try {
      const event = await this.prisma.notificationEvent.create({
        data: {
          userId,
          eventType,
          email,
          phone,
          payload: metadata ?? {},
          idempotencyKey: this.generateIdempotencyKey(
            userId,
            eventType,
            metadata ?? {},
          ),
        },
      });
      await this.notificationProcessor.processEvent(event.id);
      return event;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // P2002 = unique constraint violation (idempotencyKey clash)
        if (error.code === 'P2002') {
          throw new ConflictException('Duplicate notification event');
        }
      }
      throw new DatabaseException(
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
