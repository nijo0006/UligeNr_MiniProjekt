export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const badInput = message => new AppError(400, 'INVALID_INPUT', message);
