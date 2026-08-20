import { User } from "../../../domain/entities/User"
import { NotFoundError } from "../../../domain/errors"
import { requireUuid } from "../../../domain/validation"
import { UserRepository } from "../../ports/UserRepository"

export class GetUserById {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: unknown): Promise<User> {
    const user = await this.repository.findById(requireUuid(id, "id"))
    if (!user) throw new NotFoundError("Usuário não encontrado")
    return user
  }
}
