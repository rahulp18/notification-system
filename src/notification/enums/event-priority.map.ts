import { NotificationPriority } from '../../prisma/generated/enums';
import { AuthEventType } from './auth-event-type.enum';
import { OrderEventType } from './order-event-type.enum';
import { OtpEventType } from './otp-event-type.enum';

export const EVENT_PRIORITY_MAP: Record<string, NotificationPriority> = {
  // Critical — immediate delivery
  [OtpEventType.OTP_REQUESTED]: NotificationPriority.CRITICAL,
  [OtpEventType.OTP_FAILED]: NotificationPriority.CRITICAL,
  [AuthEventType.ACCOUNT_LOCKED]: NotificationPriority.CRITICAL,
  [AuthEventType.SUSPICIOUS_ACTIVITY]: NotificationPriority.CRITICAL,

  // High
  [OtpEventType.OTP_VERIFIED]: NotificationPriority.HIGH,
  [AuthEventType.PASSWORD_RESET]: NotificationPriority.HIGH,

  // Medium
  [OrderEventType.ORDER_PLACED]: NotificationPriority.MEDIUM,
  [OrderEventType.ORDER_CONFIRMED]: NotificationPriority.MEDIUM,
  [OrderEventType.ORDER_CANCELLED]: NotificationPriority.MEDIUM,

  // Low (default fallback)
  [AuthEventType.USER_REGISTERED]: NotificationPriority.LOW,
  [AuthEventType.USER_LOGIN]: NotificationPriority.LOW,
} as const;

export const DEFAULT_PRIORITY = NotificationPriority.LOW;
