import { NotificationEvent } from '../prisma/generated/client';

export class NotificationMessageFactory {
  static build(event: NotificationEvent): string {
    const payload = event.payload as Record<string, any>;

    const templates: Record<string, (p: any) => string> = {
      OTP_REQUESTED: (p) =>
        `Your OTP is ${p?.otp}. Valid for ${p?.expiresIn ?? 5} minutes.`,

      OTP_VERIFIED: () => `Your OTP has been verified successfully.`,

      OTP_FAILED: () => `OTP verification failed. Please try again.`,

      OTP_EXPIRED: () => `Your OTP has expired. Please request a new one.`,

      USER_REGISTERED: (p) =>
        `Welcome, ${p?.name ?? 'there'}! Your account has been created.`,

      PASSWORD_RESET: () => `A password reset was requested for your account.`,

      ACCOUNT_LOCKED: () =>
        `Your account has been locked. Please contact support.`,

      SUSPICIOUS_ACTIVITY: (p) =>
        `Suspicious activity detected from ${p?.ip ?? 'unknown location'}.`,

      ORDER_PLACED: (p) =>
        `Your order #${p?.orderId} has been placed successfully.`,

      ORDER_CONFIRMED: (p) => `Your order #${p?.orderId} has been confirmed.`,

      ORDER_CANCELLED: (p) => `Your order #${p?.orderId} has been cancelled.`,
    };

    const builder = templates[event.eventType];

    try {
      return builder
        ? builder(payload)
        : `You have a new notification for event: ${event.eventType}`;
    } catch {
      return `Notification for ${event.eventType}`;
    }
  }
}
