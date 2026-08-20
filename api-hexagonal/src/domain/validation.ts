import { ValidationError } from "./errors"

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Regras de formato compartilhadas pelas entidades do domínio.
 *
 * Não dependem de nenhum recurso externo: são funções puras, exercitáveis
 * sem banco de dados, servidor HTTP ou qualquer dublê de teste.
 */

export function requireText(value: unknown, field: string, minLength: number): string {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new ValidationError(
      `O campo ${field} deve possuir no mínimo ${minLength} caracteres`
    )
  }
  return value.trim()
}

export function requireEmail(value: unknown): string {
  if (typeof value !== "string" || !EMAIL_FORMAT.test(value.trim())) {
    throw new ValidationError("E-mail em formato inválido")
  }
  return value.trim().toLowerCase()
}

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_FORMAT.test(value)) {
    throw new ValidationError(`O campo ${field} deve ser um UUID válido`)
  }
  return value
}

export function optionalBoolean(value: unknown, field: string): boolean | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "boolean") {
    throw new ValidationError(`O campo ${field} deve ser true ou false`)
  }
  return value
}

export function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") {
    throw new ValidationError(`O campo ${field} deve ser um texto`)
  }
  return value.trim() || null
}

export function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null
  return requireUuid(value, field)
}
