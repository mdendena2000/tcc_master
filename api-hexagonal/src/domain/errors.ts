/**
 * Erros do núcleo da aplicação.
 *
 * Diferentemente da versão MVC, onde o erro carrega o código HTTP, aqui os
 * erros não conhecem o protocolo de transporte. A tradução para status HTTP é
 * responsabilidade do adaptador primário (infrastructure/http), preservando a
 * independência do domínio exigida pela Seção 2.3.1 e verificada pela RNF05.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** Violação de restrição de atributo da entidade. */
export class ValidationError extends DomainError {}

/** Recurso inexistente. */
export class NotFoundError extends DomainError {}

/** Violação de regra de unicidade ou de estado. */
export class ConflictError extends DomainError {}
