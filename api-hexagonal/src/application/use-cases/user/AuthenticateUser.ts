import { User } from "../../../domain/entities/User"
import { UnauthorizedError } from "../../../domain/errors"
import { UserRepository } from "../../ports/UserRepository"

/**
 * Autentica um usuário a partir de e-mail e senha (POST /login).
 *
 * A verificação da senha pertence à entidade (User.authenticate); ao caso de
 * uso cabe localizar o usuário e uniformizar a resposta de falha.
 *
 * A mesma mensagem é usada para e-mail inexistente e senha incorreta, para
 * não revelar quais endereços estão cadastrados.
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
