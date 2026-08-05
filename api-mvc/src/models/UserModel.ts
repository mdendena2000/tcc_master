import { randomUUID } from "crypto"
import { UserRepository } from "../repositories/UserRepository"
import { ConflictError, NotFoundError, ValidationError } from "./errors"
import { User } from "./User"

const NAME_MIN_LENGTH = 2
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Model do recurso Users: concentra as regras de negócio e delega a
 * persistência ao UserRepository, conforme o fluxo
 * Controller -> Model -> Repository -> PostgreSQL (Figura 2 e Seção 4.8).
 *
 * Regras aplicadas:
 *   - RN01: unicidade de e-mail no sistema.
 *   - Restrições da Tabela 9: nome com no mínimo 2 caracteres e e-mail em
 *     formato válido.
 */
export class UserModel {
  private repository = new UserRepository()

  async create(name: string, email: string): Promise<User> {
    const validName = this.validateName(name)
    const validEmail = this.validateEmail(email)

    // RN01
    if (await this.repository.findByEmail(validEmail)) {
      throw new ConflictError("E-mail já cadastrado")
    }

    return this.repository.create({
      id: randomUUID(),
      name: validName,
      email: validEmail,
      created_at: new Date(),
    })
  }

  async findAll(): Promise<User[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id)
    if (!user) throw new NotFoundError("Usuário não encontrado")
    return user
  }

  async update(id: string, name: string, email: string): Promise<User> {
    const validName = this.validateName(name)
    const validEmail = this.validateEmail(email)

    await this.findById(id)

    // RN01: o e-mail pode permanecer o mesmo, mas não pode pertencer a outro usuário
    const emailOwner = await this.repository.findByEmail(validEmail)
    if (emailOwner && emailOwner.id !== id) {
      throw new ConflictError("E-mail já cadastrado")
    }

    return this.repository.update(id, validName, validEmail)
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.repository.delete(id)
  }

  private validateName(name: unknown): string {
    if (typeof name !== "string" || name.trim().length < NAME_MIN_LENGTH) {
      throw new ValidationError(
        `O nome deve possuir no mínimo ${NAME_MIN_LENGTH} caracteres`
      )
    }
    return name.trim()
  }

  private validateEmail(email: unknown): string {
    if (typeof email !== "string" || !EMAIL_FORMAT.test(email.trim())) {
      throw new ValidationError("E-mail em formato inválido")
    }
    return email.trim().toLowerCase()
  }
}