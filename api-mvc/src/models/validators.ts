import { ValidationError } from "./errors"

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validações das restrições de atributo declaradas nas Tabelas 9, 10 e 11
 * do TCC, compartilhadas pelos Models.
 */

/** Texto obrigatório com tamanho mínimo; retorna o valor sem espaços nas bordas. */
export function validateText(
  value: unknown,
  field: string,
  minLength: number
): string {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new ValidationError(
      `O campo ${field} deve possuir no mínimo ${minLength} caracteres`
    )
  }
  return value.trim()
}

/** E-mail em formato válido; retorna o valor normalizado em minúsculas. */
export function validateEmail(value: unknown): string {
  if (typeof value !== "string" || !EMAIL_FORMAT.test(value.trim())) {
    throw new ValidationError("E-mail em formato inválido")
  }
  return value.trim().toLowerCase()
}

/**
 * UUID em formato válido.
 *
 * Sem essa verificação, um identificador malformado chegaria ao PostgreSQL e
 * produziria erro de driver (HTTP 500) em vez da resposta 404 esperada.
 */
export function validateUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_FORMAT.test(value)) {
    throw new ValidationError(`O campo ${field} deve ser um UUID válido`)
  }
  return value
}

/** Valor pertencente a um conjunto fechado, como os ENUMs da Tabela 11. */
export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(
      `O campo ${field} deve ser um dos valores: ${allowed.join(", ")}`
    )
  }
  return value as T
}

/** Texto opcional; retorna null quando ausente ou vazio. */
export function validateOptionalText(
  value: unknown,
  field: string
): string | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") {
    throw new ValidationError(`O campo ${field} deve ser um texto`)
  }
  return value.trim() || null
}

/** UUID opcional; retorna null quando ausente. */
export function validateOptionalUuid(
  value: unknown,
  field: string
): string | null {
  if (value === undefined || value === null || value === "") return null
  return validateUuid(value, field)
}

/**
 * Booleano opcional; retorna null quando ausente, permitindo ao Model
 * distinguir "não informado" de "informado como false".
 */
export function validateOptionalBoolean(
  value: unknown,
  field: string
): boolean | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "boolean") {
    throw new ValidationError(`O campo ${field} deve ser true ou false`)
  }
  return value
}