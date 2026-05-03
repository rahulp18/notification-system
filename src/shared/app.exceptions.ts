import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super({ message, statusCode: status }, status);
  }
}

export class NotFoundException extends AppException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class DatabaseException extends AppException {
  constructor(cause?: string) {
    super(
      cause ?? 'A database error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
