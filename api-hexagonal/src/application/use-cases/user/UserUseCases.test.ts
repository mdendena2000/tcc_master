/**
 * Os casos de uso dependem da porta UserRepository, então o teste substitui
 * a porta por um fake em memória construído a partir da interface. Não há
 * nenhum jest.mock: o teste desconhece qual banco existe do outro lado e não
 * quebraria se o PostgreSQL fosse trocado.
 */
import { InMemoryUserRepository } from "../../../test-support/InMemoryRepositories"
import { AuthenticateUser } from "./AuthenticateUser"
import { CreateUser } from "./CreateUser"
import { DeleteUser } from "./DeleteUser"
import { GetUserById } from "./GetUserById"
import { ListUsers } from "./ListUsers"
import { UpdateUser } from "./UpdateUser"

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000"

describe("Casos de uso de Users", () => {
  let repository: InMemoryUserRepository

  beforeEach(() => {
    repository = new InMemoryUserRepository()
  })

  describe("CreateUser", () => {
    it("deve criar e persistir o usuário", async () => {
      const user = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      expect(user.name).toBe("João")
      expect(repository.users).toHaveLength(1)
    })

    // RN01
    it("deve recusar e-mail já cadastrado", async () => {
      const createUser = new CreateUser(repository)
      await createUser.execute({ name: "João", email: "joao@email.com", password: "senha123" })

      await expect(
        createUser.execute({ name: "Outro", email: "joao@email.com", password: "senha123" })
      ).rejects.toThrow("E-mail já cadastrado")

      expect(repository.users).toHaveLength(1)
    })

    it("deve propagar erro de validação da entidade", async () => {
      await expect(
        new CreateUser(repository).execute({ name: "J", email: "joao@email.com", password: "senha123" })
      ).rejects.toThrow()

      expect(repository.users).toHaveLength(0)
    })
  })

  describe("ListUsers", () => {
    it("deve listar os usuários existentes", async () => {
      await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      await expect(new ListUsers(repository).execute()).resolves.toHaveLength(1)
    })
  })

  describe("GetUserById", () => {
    it("deve retornar o usuário quando existe", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      const user = await new GetUserById(repository).execute(criado.id)

      expect(user.id).toBe(criado.id)
    })

    it("deve lançar erro quando não existe", async () => {
      await expect(new GetUserById(repository).execute(UUID_INEXISTENTE))
        .rejects.toThrow("Usuário não encontrado")
    })

    it("deve recusar id malformado", async () => {
      await expect(new GetUserById(repository).execute("abc"))
        .rejects.toThrow("O campo id deve ser um UUID válido")
    })
  })

  describe("UpdateUser", () => {
    it("deve atualizar mantendo o próprio e-mail", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      const user = await new UpdateUser(repository).execute(criado.id, {
        name: "João Silva",
        email: "joao@email.com",
        password: "senha123",
      })

      expect(user.name).toBe("João Silva")
      expect(repository.users[0].name).toBe("João Silva")
    })

    it("deve preservar o perfil quando admin é omitido", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
        admin: true,
      })

      const user = await new UpdateUser(repository).execute(criado.id, {
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      expect(user.admin).toBe(true)
    })

    // RN01
    it("deve recusar e-mail pertencente a outro usuário", async () => {
      const createUser = new CreateUser(repository)
      const joao = await createUser.execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })
      await createUser.execute({ name: "Maria", email: "maria@email.com", password: "senha123" })

      await expect(
        new UpdateUser(repository).execute(joao.id, {
          name: "João",
          email: "maria@email.com",
        password: "senha123",
        })
      ).rejects.toThrow("E-mail já cadastrado")
    })

    it("deve lançar erro quando o usuário não existe", async () => {
      await expect(
        new UpdateUser(repository).execute(UUID_INEXISTENTE, {
          name: "João",
          email: "joao@email.com",
        password: "senha123",
        })
      ).rejects.toThrow("Usuário não encontrado")
    })
  })

  describe("AuthenticateUser", () => {
    beforeEach(async () => {
      await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })
    })

    it("deve autenticar com credenciais corretas", async () => {
      const user = await new AuthenticateUser(repository)
        .execute("joao@email.com", "senha123")

      expect(user.email).toBe("joao@email.com")
    })

    it("deve normalizar o e-mail informado", async () => {
      await expect(
        new AuthenticateUser(repository).execute("  JOAO@Email.com  ", "senha123")
      ).resolves.toBeDefined()
    })

    it("deve recusar senha incorreta", async () => {
      await expect(
        new AuthenticateUser(repository).execute("joao@email.com", "errada")
      ).rejects.toThrow("Credenciais inválidas")
    })

    it("deve recusar e-mail inexistente", async () => {
      await expect(
        new AuthenticateUser(repository).execute("ninguem@email.com", "senha123")
      ).rejects.toThrow("Credenciais inválidas")
    })

    it("deve usar a mesma mensagem nos dois casos de falha", async () => {
      const auth = new AuthenticateUser(repository)
      const semEmail = await auth.execute("x@email.com", "senha123").catch((e) => e)
      const senhaErrada = await auth.execute("joao@email.com", "x").catch((e) => e)

      expect(semEmail.message).toBe(senhaErrada.message)
      expect(semEmail.constructor).toBe(senhaErrada.constructor)
    })

    it("deve recusar quando o e-mail não é texto", async () => {
      await expect(new AuthenticateUser(repository).execute(123, "senha123"))
        .rejects.toThrow("Credenciais inválidas")
    })
  })

  describe("UpdateUser troca de senha", () => {
    it("deve trocar a senha quando informada", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      await new UpdateUser(repository).execute(criado.id, {
        name: "João",
        email: "joao@email.com",
        password: "novaSenha456",
      })

      const auth = new AuthenticateUser(repository)
      await expect(auth.execute("joao@email.com", "novaSenha456")).resolves.toBeDefined()
      await expect(auth.execute("joao@email.com", "senha123")).rejects.toThrow()
    })

    it("deve preservar a senha quando omitida", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      await new UpdateUser(repository).execute(criado.id, {
        name: "João Silva",
        email: "joao@email.com",
      })

      await expect(
        new AuthenticateUser(repository).execute("joao@email.com", "senha123")
      ).resolves.toBeDefined()
    })
  })

  describe("DeleteUser", () => {
    it("deve remover o usuário existente", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      await new DeleteUser(repository).execute(criado.id)

      expect(repository.users).toHaveLength(0)
    })

    it("deve lançar erro quando o usuário não existe", async () => {
      await expect(new DeleteUser(repository).execute(UUID_INEXISTENTE))
        .rejects.toThrow("Usuário não encontrado")
    })
  })
})
