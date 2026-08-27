import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { ValidationError } from "../errors"

const SALT_BYTES = 16
const KEY_LENGTH = 64
const MIN_LENGTH = 6

/**
 * Value object Password.
 *
 * Encapsula a derivação e a verificação da senha, de modo que o restante do
 * sistema nunca manipula o valor em texto: a entidade User guarda um
 * Password, e não uma string.
 *
 * Usa scrypt do módulo crypto do Node.js, evitando dependências novas e
 * preservando o stack compartilhado exigido pela RNF02.
 */
export class Password {
  private constructor(public readonly hash: string) {}

  static create(plain: unknown): Password {
    if (typeof plain !== "string" || plain.length < MIN_LENGTH) {
      throw new ValidationError(
        `O campo password deve possuir no mínimo ${MIN_LENGTH} caracteres`
      )
    }

    const salt = randomBytes(SALT_BYTES).toString("hex")
    const derived = scryptSync(plain, salt, KEY_LENGTH).toString("hex")
    return new Password(`${salt}:${derived}`)
  }

  static fromHash(hash: string): Password {
    return new Password(hash)
  }

  matches(plain: unknown): boolean {
    if (typeof plain !== "string") return false

    const [salt, esperado] = this.hash.split(":")
    if (!salt || !esperado) return false

    const original = Buffer.from(esperado, "hex")
    const obtido = scryptSync(plain, salt, KEY_LENGTH)
    return original.length === obtido.length && timingSafeEqual(original, obtido)
  }
}
