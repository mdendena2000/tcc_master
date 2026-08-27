import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const SALT_BYTES = 16
const KEY_LENGTH = 64

/**
 * Derivação e verificação de senha com scrypt, disponível no módulo crypto
 * do próprio Node.js.
 *
 * A escolha evita acrescentar dependências ao projeto, preservando o stack
 * compartilhado exigido pela RNF02. O hash é armazenado no formato
 * "salt:derivada", ambos em hexadecimal.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = scryptSync(plain, salt, KEY_LENGTH).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false

  const esperado = Buffer.from(hash, "hex")
  const obtido = scryptSync(plain, salt, KEY_LENGTH)

  // Comparação em tempo constante, para não vazar informação por temporização
  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido)
}
