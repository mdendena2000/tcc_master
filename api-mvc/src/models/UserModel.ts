import { randomUUID } from "crypto"
import { UserRepository } from "../repositories/UserRepository"
import { ConflictError, NotFoundError } from "./errors"
import { User } from "./User"
import {
  validateEmail,
  validateOptionalBoolean,
  validateText,
  validateUuid,
} from "./validators"

const NAME_MIN_LENGTH = 2

/**
 * Model do recurso Users: concentra as regras de negócio e delega a
 * persistência ao UserRepository, conforme o fluxo
 * Controller -> Model -> Repository -> PostgreSQL (Figura 2 e Seção 4.8).
 *
 * Regras aplicadas:
 *   - RN01: unicidade de e-mail no sistema.
 *   - Restrições da Tabela 9: nome com no mínimo 2 caracteres e e-mail em
 *     formato válido.
 *   - admin é opcional e assume false na criação.
 */
export class UserModel {
  private repository = new UserRepository()

  async create(name: string, email: string, admin?: unknown): Promise<User> {
    const validName = validateText(name, "name", NAME_MIN_LENGTH)
    const validEmail = validateEmail(email)
    const validAdmin = validateOptionalBoolean(admin, "admin") ?? false

    // RN01
    if (await this.repository.findByEmail(validEmail)) {
      throw new ConflictError("E-mail já cadastrado")
    }

    return this.repository.create({
      id: randomUUID(),
      name: validName,
      email: validEmail,
      admin: validAdmin,
      created_at: new Date(),
    })
  }

  async findAll(): Promise<User[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(validateUuid(id, "id"))
    if (!user) throw new NotFoundError("Usuário não encontrado")
    return user
  }

  async update(
    id: string,
    name: string,
    email: string,
    admin?: unknown
  ): Promise<User> {
    const validName = validateText(name, "name", NAME_MIN_LENGTH)
    const validEmail = validateEmail(email)
    const validAdmin = validateOptionalBoolean(admin, "admin")

    const user = await this.findById(id)

    const emailOwner = await this.repository.findByEmail(validEmail)

    if (emailOwner && emailOwner.id !== id) {
      throw new ConflictError("E-mail já cadastrado")
    }

    return this.repository.update(
      id,
      validName,
      validEmail,
      validAdmin ?? user.admin
    )
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.repository.delete(id)
  }
}