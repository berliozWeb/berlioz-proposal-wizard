import type { DomainError } from '@/domain/shared/Result';

export class ValidationError extends Error implements DomainError {
  readonly code = 'VALIDATION_ERROR';
  constructor(public readonly message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements DomainError {
  readonly code = 'NOT_FOUND';
  constructor(public readonly message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ExternalServiceError extends Error implements DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  constructor(public readonly message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class UnexpectedError extends Error implements DomainError {
  readonly code = 'UNEXPECTED_ERROR';
  constructor(public readonly message: string = 'Ha ocurrido un error inesperado') {
    super(message);
    this.name = 'UnexpectedError';
  }
}
