import { ValidationError } from "./errors"

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_FORMAT =  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export function validateEmail(value: unknown): string {
  if (typeof value !== "string" || !EMAIL_FORMAT.test(value.trim())) {
    throw new ValidationError("E-mail em formato inválido")
  }
  return value.trim().toLowerCase()
}

export function validateUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_FORMAT.test(value)) {
    throw new ValidationError(`O campo ${field} deve ser um UUID válido`)
  }
  return value
}

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

export function validateOptionalUuid(
  value: unknown,
  field: string
): string | null {
  if (value === undefined || value === null || value === "") return null
  return validateUuid(value, field)
}

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