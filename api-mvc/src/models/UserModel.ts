import { randomUUID } from "crypto"
import { UserRepository } from "../repositories/UserRepository"
import { ConflictError, NotFoundError, UnauthorizedError } from "./errors"
import { hashPassword, verifyPassword } from "./password"
import { User } from "./User"
import {
  validateEmail,
  validateOptionalBoolean,
  validatePassword,
  validateText,
  validateUuid,
} from "./validators"

const NAME_MIN_LENGTH = 2
const PASSWORD_MIN_LENGTH = 6

/**
 * Regras aplicadas: - RN01: unicidade de e-mail no sistema. - Restrições da
 * Tabela 9: nome com no mínimo 2 caracteres, e-mail em formato válido e
 * senha com no mínimo 6 caracteres. - admin é opcional e assume false na
 * criação.
 */
export class UserModel {
  private repository = new UserRepository()

  async create(
    name: string,
    email: string,
    password: unknown,
    admin?: unknown
  ): Promise<User> {
    const validName = validateText(name, "name", NAME_MIN_LENGTH)
    const validEmail = validateEmail(email)
    const validPassword = validatePassword(password, PASSWORD_MIN_LENGTH)
    const validAdmin = validateOptionalBoolean(admin, "admin") ?? false

    // RN01
    if (await this.repository.findByEmail(validEmail)) {
      throw new ConflictError("E-mail já cadastrado")
    }

    return this.repository.create(
      {
        id: randomUUID(),
        name: validName,
        email: validEmail,
        admin: validAdmin,
        created_at: new Date(),
      },
      hashPassword(validPassword)
    )
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
    admin?: unknown,
    password?: unknown
  ): Promise<User> {
    const validName = validateText(name, "name", NAME_MIN_LENGTH)
    const validEmail = validateEmail(email)
    const validAdmin = validateOptionalBoolean(admin, "admin")

    const user = await this.findById(id)

    // RN01: o e-mail pode permanecer o mesmo, mas não pode pertencer a outro usuário
    const emailOwner = await this.repository.findByEmail(validEmail)
    if (emailOwner && emailOwner.id !== id) {
      throw new ConflictError("E-mail já cadastrado")
    }

    // A senha só é trocada quando informada
    if (password !== undefined && password !== null && password !== "") {
      const validPassword = validatePassword(password, PASSWORD_MIN_LENGTH)
      await this.repository.updatePassword(id, hashPassword(validPassword))
    }

    // Omitir admin preserva o perfil atual, evitando rebaixar um
    // administrador por engano quando o campo não é enviado.
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

  /**
   * Autentica um usuário a partir de e-mail e senha (POST /login).
   *
   * A mesma mensagem é usada para e-mail inexistente e senha incorreta, para
   * não revelar quais endereços estão cadastrados.
   */
  async authenticate(email: unknown, password: unknown): Promise<User> {
    const credenciaisInvalidas = new UnauthorizedError("Credenciais inválidas")

    if (typeof email !== "string" || typeof password !== "string") {
      throw credenciaisInvalidas
    }

    const normalizado = email.trim().toLowerCase()
    const hash = await this.repository.findPasswordHashByEmail(normalizado)
    if (!hash || !verifyPassword(password, hash)) {
      throw credenciaisInvalidas
    }

    const user = await this.repository.findByEmail(normalizado)
    if (!user) throw credenciaisInvalidas
    return user
  }
}
