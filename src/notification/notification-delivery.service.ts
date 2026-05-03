import { Injectable, Logger } from '@nestjs/common';
import { EXTERNAL_USERS } from '../constants/user';
import { NotificationChannel, Prisma } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseException } from '../shared/app.exceptions';

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createDeliveriesForNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { event: true },
    });
    if (!notification) {
      throw new DatabaseException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    // THIS EXTERNAL USERS ARRAY IS A MOCK. IN REAL SCENARIO, YOU WOULD QUERY YOUR USER DATABASE OR AN EXTERNAL SERVICE TO GET USER DETAILS.
    const user = EXTERNAL_USERS.find((user) => user.id === notification.userId);
    const email = user?.email ?? notification.event?.email;
    const phone = user?.phone ?? notification.event?.phone;
    if (!email && !phone) {
      throw new DatabaseException(
        `No valid contact information (email or phone) found for user ${notification.userId} or event ${notification.eventId}`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      if (email) {
        await this.createDeliveryIfNotExists(
          tx,
          notification?.id,
          NotificationChannel.EMAIL,
        );
      }
      if (phone) {
        await this.createDeliveryIfNotExists(
          tx,
          notification?.id,
          NotificationChannel.SMS,
        );
      }
    });
  }
  private async createDeliveryIfNotExists(
    tx: Prisma.TransactionClient,
    notificationId: string,
    channel: NotificationChannel,
  ): Promise<void> {
    const exists = await tx.notificationDelivery.findFirst({
      where: { notificationId, channel },
    });
    if (!exists) {
      await tx.notificationDelivery.create({
        data: {
          notificationId,
          channel,
          provider:
            channel === NotificationChannel.EMAIL ? 'SendGrid' : 'Twilio',
        },
      });
    }
  }
}
