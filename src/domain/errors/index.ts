import type { DomainError } from '@/domain/shared/Result';

export class ValidationError implements DomainError {
  readonly code = 'VALIDATION_ERROR';
  constructor(public readonly message: string, public readonly field?: string) {}
}

export class NotFoundError implements DomainError {
  readonly code = 'NOT_FOUND';
  constructor(public readonly message: string) {}
}

export class ExternalServiceError implements DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  constructor(public readonly message: string, public readonly cause?: unknown) {}
}

export class UnexpectedError implements DomainError {
  readonly code = 'UNEXPECTED_ERROR';
  constructor(public readonly message: string = 'Ha ocurrido un error inesperado') {}
}
