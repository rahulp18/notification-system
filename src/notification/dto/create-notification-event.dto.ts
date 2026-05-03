import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import {
  AuthEventType,
  NotificationEventType,
  OrderEventType,
  OtpEventType,
} from '../enums';

// Flat array of all valid values for runtime validation
const ALL_EVENT_TYPES: string[] = [
  ...Object.values(OtpEventType),
  ...Object.values(AuthEventType),
  ...Object.values(OrderEventType),
];
export class CreateNotificationEventDto {
  @IsString()
  userId!: string;
  @IsIn(ALL_EVENT_TYPES, {
    message: `eventType must be one of: ${ALL_EVENT_TYPES.join(', ')}`,
  })
  eventType!: NotificationEventType;
  @IsOptional()
  @IsString()
  email?: string;
  @IsOptional()
  @IsString()
  phone?: string;
  @IsObject()
  metadata?: Record<string, any>;
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
