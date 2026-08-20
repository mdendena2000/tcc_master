/**
 * Testes dos casos de uso do recurso Users (Hexagonal).
 *
 * Os casos de uso dependem da porta UserRepository, então o teste substitui a
 * porta por um fake em memória construído a partir da interface. Não há
 * nenhum jest.mock: o teste desconhece qual banco existe do outro lado e não
 * quebraria se o PostgreSQL fosse trocado.
 *
 * Contraste medido pela Seção 3.7.2c: o UserModel.test.ts do MVC precisa
 * interceptar o módulo do repositório com jest.mock para alcançar o mesmo
 * isolamento.
 */
import { InMemoryUserRepository } from "../../../test-support/InMemoryRepositories"
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
      })

      expect(user.name).toBe("João")
      expect(repository.users).toHaveLength(1)
    })

    // RN01
    it("deve recusar e-mail já cadastrado", async () => {
      const createUser = new CreateUser(repository)
      await createUser.execute({ name: "João", email: "joao@email.com" })

      await expect(
        createUser.execute({ name: "Outro", email: "joao@email.com" })
      ).rejects.toThrow("E-mail já cadastrado")

      expect(repository.users).toHaveLength(1)
    })

    it("deve propagar erro de validação da entidade", async () => {
      await expect(
        new CreateUser(repository).execute({ name: "J", email: "joao@email.com" })
      ).rejects.toThrow()

      expect(repository.users).toHaveLength(0)
    })
  })

  describe("ListUsers", () => {
    it("deve listar os usuários existentes", async () => {
      await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
      })

      await expect(new ListUsers(repository).execute()).resolves.toHaveLength(1)
    })
  })

  describe("GetUserById", () => {
    it("deve retornar o usuário quando existe", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
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
      })

      const user = await new UpdateUser(repository).execute(criado.id, {
        name: "João Silva",
        email: "joao@email.com",
      })

      expect(user.name).toBe("João Silva")
      expect(repository.users[0].name).toBe("João Silva")
    })

    it("deve preservar o perfil quando admin é omitido", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
        admin: true,
      })

      const user = await new UpdateUser(repository).execute(criado.id, {
        name: "João",
        email: "joao@email.com",
      })

      expect(user.admin).toBe(true)
    })

    // RN01
    it("deve recusar e-mail pertencente a outro usuário", async () => {
      const createUser = new CreateUser(repository)
      const joao = await createUser.execute({
        name: "João",
        email: "joao@email.com",
      })
      await createUser.execute({ name: "Maria", email: "maria@email.com" })

      await expect(
        new UpdateUser(repository).execute(joao.id, {
          name: "João",
          email: "maria@email.com",
        })
      ).rejects.toThrow("E-mail já cadastrado")
    })

    it("deve lançar erro quando o usuário não existe", async () => {
      await expect(
        new UpdateUser(repository).execute(UUID_INEXISTENTE, {
          name: "João",
          email: "joao@email.com",
        })
      ).rejects.toThrow("Usuário não encontrado")
    })
  })

  describe("DeleteUser", () => {
    it("deve remover o usuário existente", async () => {
      const criado = await new CreateUser(repository).execute({
        name: "João",
        email: "joao@email.com",
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
