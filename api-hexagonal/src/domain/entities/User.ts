import { randomUUID } from "crypto"
import { optionalBoolean, requireEmail, requireText } from "../validation"
import { Password } from "../value-objects/Password"

const NAME_MIN_LENGTH = 2

interface UserProps {
  id: string
  name: string
  email: string
  admin: boolean
  passwordHash: string
  createdAt: Date
}

/**
 * Entidade User (Tabela 9 do TCC).
 *
 * Diferentemente do MVC, onde User é apenas uma interface de dados e as
 * regras vivem no UserModel, aqui a entidade encapsula suas próprias
 * invariantes: não é possível construir um User com nome curto ou e-mail
 * inválido. As validações são exercitáveis sem infraestrutura.
 *
 * A RN01 (unicidade de e-mail) não pertence à entidade: depende de consultar
 * os demais usuários, e por isso é orquestrada pelos casos de uso.
 */
export class User {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _email: string,
    private _admin: boolean,
    private _password: Password,
    public readonly createdAt: Date
  ) {}

  /** Cria um novo usuário, validando as invariantes da Tabela 9. */
  static create(input: {
    name: unknown
    email: unknown
    password: unknown
    admin?: unknown
  }): User {
    return new User(
      randomUUID(),
      requireText(input.name, "name", NAME_MIN_LENGTH),
      requireEmail(input.email),
      optionalBoolean(input.admin, "admin") ?? false,
      Password.create(input.password),
      new Date()
    )
  }

  /**
   * Reconstitui uma entidade já persistida, sem revalidar.
   *
   * Usado apenas pelos adaptadores de saída ao ler do banco.
   */
  static restore(props: UserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.admin,
      Password.fromHash(props.passwordHash),
      props.createdAt
    )
  }

  get name(): string {
    return this._name
  }

  get email(): string {
    return this._email
  }

  get admin(): boolean {
    return this._admin
  }

  /**
   * Hash da senha, exposto apenas para persistência pelo adaptador de saída.
   * O valor em texto nunca é armazenado na entidade.
   */
  get passwordHash(): string {
    return this._password.hash
  }

  /** Verifica a senha informada na autenticação. */
  authenticate(plain: unknown): boolean {
    return this._password.matches(plain)
  }

  /** Troca a senha, revalidando o tamanho mínimo. */
  changePassword(plain: unknown): void {
    this._password = Password.create(plain)
  }

  rename(name: unknown): void {
    this._name = requireText(name, "name", NAME_MIN_LENGTH)
  }

  changeEmail(email: unknown): void {
    this._email = requireEmail(email)
  }

  /** Omitir o valor preserva o perfil atual. */
  changeAdmin(admin: unknown): void {
    const valor = optionalBoolean(admin, "admin")
    if (valor !== null) this._admin = valor
  }
}
