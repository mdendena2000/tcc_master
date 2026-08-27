import { User } from "../../domain/entities/User"

/** Porta secundária (outbound) de persistência de usuários. */
export interface UserRepository {
  save(user: User): Promise<void>
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  delete(id: string): Promise<void>
}
