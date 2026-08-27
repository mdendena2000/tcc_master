export class AppError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}
