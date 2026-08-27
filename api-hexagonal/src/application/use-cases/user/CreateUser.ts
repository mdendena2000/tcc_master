import { User } from "../../../domain/entities/User"
import { ConflictError } from "../../../domain/errors"
import { UserRepository } from "../../ports/UserRepository"

interface CreateUserInput {
  name: unknown
  email: unknown
  password: unknown
  admin?: unknown
}

/**
 * Cria um usuário aplicando a RN01 (unicidade de e-mail).
 *
 * Depende apenas da porta UserRepository — nunca de uma implementação
 * concreta —, o que permite testá-lo com um dublê construído a partir da
 * interface, sem interceptar módulos.
 */
export class CreateUser {
  constructor(private readonly repository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = User.create(input)

    // RN01
    if (await this.repository.findByEmail(user.email)) {
      throw new ConflictError("E-mail já cadastrado")
    }

    await this.repository.save(user)
    return user
  }
}
