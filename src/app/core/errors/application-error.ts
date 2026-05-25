export class ApplicationError extends Error {
  override readonly name = 'ApplicationError';

  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}