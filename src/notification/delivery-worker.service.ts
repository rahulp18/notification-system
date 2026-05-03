import { Injectable, Logger } from '@nestjs/common';
import { DeliveryStatus, NotificationStatus } from '../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryWorkerService {
  private readonly logger = new Logger(DeliveryWorkerService.name);
  constructor(private readonly prisma: PrismaService) {}

  async processPendingDeliveries(): Promise<void> {
    const now = new Date();
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        status: {
          in: [DeliveryStatus.PENDING, DeliveryStatus.RETRYING],
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      include: { notification: true },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });
    if (!deliveries.length) {
      this.logger.log('No pending deliveries to process at this time.');
      return;
    }
    for (const delivery of deliveries) {
      await this.processSingleDelivery(delivery);
    }
  }
  async processSingleDelivery(delivery: any): Promise<void> {
    try {
      const lock = await this.prisma.notificationDelivery.updateMany({
        where: {
          id: delivery.id,
          status: {
            in: [DeliveryStatus.PENDING, DeliveryStatus.RETRYING],
          },
        },
        data: {
          status: DeliveryStatus.RETRYING,
          lastAttemptAt: new Date(),
        },
      });
      if (lock.count === 0) {
        this.logger.warn(
          `Delivery ${delivery.id} is already being processed by another worker.`,
        );
        return;
      }
      await this.sendDelivery(delivery);
      //   SUCCESS
      await this.prisma.$transaction(async (tx) => {
        await tx.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.SENT,
            deliveredAt: new Date(),
          },
        });
        await tx.deliveryAttempt.create({
          data: {
            deliveryId: delivery.id,
            attemptNumber: delivery.retryCount + 1,
            status: DeliveryStatus.SENT,
          },
        });
        // check if all deliveries are sent
        const remaining = await tx.notificationDelivery.count({
          where: {
            notificationId: delivery.notificationId,
            status: { not: DeliveryStatus.SENT },
          },
        });
        if (remaining === 0) {
          await tx.notification.update({
            where: { id: delivery.notificationId },
            data: { status: NotificationStatus.SENT },
          });
        }
      });
      this.logger.log(
        `Successfully sent ${delivery.channel} delivery for notification ${delivery.notificationId}`,
      );
    } catch (error: any) {
      await this.handleFailure(delivery, error);
    }
  }
  private async handleFailure(delivery: any, error: Error): Promise<void> {
    this.logger.error(
      `Failed to send ${delivery.channel} delivery for notification ${delivery.notificationId}: ${error.message}`,
    );
    const retryCount = delivery.retryCount + 1;
    if (retryCount < delivery.maxRetries) {
      const delaySeconds = Math.pow(2, retryCount) * 10; // Exponential backoff: 1min, 2min, 4min, etc.
      await this.prisma.$transaction(async (tx) => {
        await tx.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.RETRYING,
            retryCount,
            nextRetryAt: new Date(Date.now() + delaySeconds * 1000),
            errorMessage: error.message,
          },
        });
        await tx.deliveryAttempt.create({
          data: {
            deliveryId: delivery.id,
            attemptNumber: retryCount,
            status: DeliveryStatus.FAILED,
            errorMessage: error.message,
            response: { error: error.message },
          },
        });
      });
    } else {
      //   MAX RETRY --> DLQ
      await this.prisma.$transaction(async (tx) => {
        await tx.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.FAILED,
            errorMessage: error.message,
          },
        });
        await tx.deadLetterQueue.create({
          data: {
            deliveryId: delivery.id,
            notificationId: delivery.notificationId,
            payload: delivery,
            reason: error.message,
          },
        });
        await tx.deliveryAttempt.create({
          data: {
            deliveryId: delivery.id,
            attemptNumber: retryCount,
            status: DeliveryStatus.FAILED,
            errorMessage: error.message,
            response: { error: error.message },
          },
        });
      });
    }
  }
  private async sendDelivery(delivery: any): Promise<void> {
    this.logger.log(
      `Sending ${delivery.channel} delivery for notification ${delivery.notificationId} to user ${delivery.notification.userId}`,
    );
    const success = Math.random() > 0.3;

    await new Promise((r) => setTimeout(r, 500));

    if (!success) {
      throw new Error('Simulated delivery failure');
    }
  }
}
