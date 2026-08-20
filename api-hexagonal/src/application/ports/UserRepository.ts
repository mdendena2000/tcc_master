import { User } from "../../domain/entities/User"

/**
 * Porta secundária (outbound) de persistência de usuários.
 *
 * O contrato é definido pelo núcleo da aplicação; a infraestrutura o
 * implementa. É essa inversão que distingue a Arquitetura Hexagonal da
 * implementação MVC, onde o Model depende da classe concreta do repositório
 * (Seção 4.9 do TCC).
 */
export interface UserRepository {
  save(user: User): Promise<void>
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  delete(id: string): Promise<void>
}
