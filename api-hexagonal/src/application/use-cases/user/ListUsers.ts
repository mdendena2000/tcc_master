import { User } from "../../../domain/entities/User"
import { UserRepository } from "../../ports/UserRepository"

export class ListUsers {
  constructor(private readonly repository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.repository.findAll()
  }
}
