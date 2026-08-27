import { User } from "../../../domain/entities/User"
import { UnauthorizedError } from "../../../domain/errors"
import { UserRepository } from "../../ports/UserRepository"

/**
 * Autentica um usuário (POST /login).
 *
 * E-mail inexistente e senha errada devolvem a mesma mensagem, para não
 * revelar quais endereços estão cadastrados.
 */
export class AuthenticateUser {
  constructor(private readonly repository: UserRepository) {}

  async execute(email: unknown, password: unknown): Promise<User> {
    const credenciaisInvalidas = new UnauthorizedError("Credenciais inválidas")

    if (typeof email !== "string") throw credenciaisInvalidas

    const user = await this.repository.findByEmail(email.trim().toLowerCase())
    if (!user || !user.authenticate(password)) throw credenciaisInvalidas

    return user
  }
}
