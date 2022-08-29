class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    (this.isOperational = true),
      (this.status = `${this.statusCode}`.startsWith("4") ? `Fail` : `Error`);

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
