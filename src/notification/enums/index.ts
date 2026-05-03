import { AuthEventType } from './auth-event-type.enum';
import { OrderEventType } from './order-event-type.enum';
import { OtpEventType } from './otp-event-type.enum';

export * from './auth-event-type.enum';
export * from './order-event-type.enum';
export * from './otp-event-type.enum';
export type NotificationEventType =
  | OtpEventType
  | AuthEventType
  | OrderEventType;
