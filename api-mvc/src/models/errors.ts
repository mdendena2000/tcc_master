/**
 * Erros de aplicação com o código HTTP correspondente.
 *
 * Permite que o Controller traduza falhas em respostas sem depender da
 * comparação de mensagens de texto.
 */
export class AppError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = new.target.name
  }
}

/** Violação de restrição de atributo (Tabela 9). */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

/** Recurso inexistente. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

/** Violação de unicidade — no recurso Users, a RN01. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}