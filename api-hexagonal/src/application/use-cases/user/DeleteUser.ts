import { UserRepository } from "../../ports/UserRepository"
import { GetUserById } from "./GetUserById"

export class DeleteUser {
  private readonly getUserById: GetUserById

  constructor(private readonly repository: UserRepository) {
    this.getUserById = new GetUserById(repository)
  }

  async execute(id: unknown): Promise<void> {
    const user = await this.getUserById.execute(id)
    await this.repository.delete(user.id)
  }
}
