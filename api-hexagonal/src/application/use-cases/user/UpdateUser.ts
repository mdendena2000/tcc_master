import { User } from "../../../domain/entities/User"
import { ConflictError } from "../../../domain/errors"
import { requireEmail } from "../../../domain/validation"
import { UserRepository } from "../../ports/UserRepository"
import { GetUserById } from "./GetUserById"

export interface UpdateUserInput {
  name: unknown
  email: unknown
  admin?: unknown
}

/**
 * Atualiza um usuário aplicando a RN01.
 *
 * As invariantes de formato são impostas pela própria entidade nos métodos
 * rename, changeEmail e changeAdmin; ao caso de uso cabe apenas a regra que
 * depende de consultar o repositório.
 *
 * A RN01 é verificada antes de qualquer mutação: alterar a entidade e só
 * depois consultar o repositório deixaria o objeto em estado inconsistente
 * quando a regra falha, e a consulta poderia encontrar a própria entidade já
 * modificada caso o repositório mantenha as instâncias em memória.
 */
export class UpdateUser {
  private readonly getUserById: GetUserById

  constructor(private readonly repository: UserRepository) {
    this.getUserById = new GetUserById(repository)
  }

  async execute(id: unknown, input: UpdateUserInput): Promise<User> {
    const user = await this.getUserById.execute(id)
    const novoEmail = requireEmail(input.email)

    // RN01: o e-mail pode permanecer o mesmo, mas não pode pertencer a outro usuário
    const emailOwner = await this.repository.findByEmail(novoEmail)
    if (emailOwner && emailOwner.id !== user.id) {
      throw new ConflictError("E-mail já cadastrado")
    }

    user.rename(input.name)
    user.changeEmail(novoEmail)
    user.changeAdmin(input.admin)

    await this.repository.save(user)
    return user
  }
}
