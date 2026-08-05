/**
 * Testes do UserModel (MVC).
 *
 * O UserModel instancia diretamente a classe concreta UserRepository. Para
 * testá-lo sem banco real é preciso interceptar o módulo com jest.mock, o que
 * acopla o teste a um detalhe de implementação: ele precisa saber qual módulo
 * o Model importa. Esse uso é contabilizado no indicador de proporção entre
 * mocks de módulo e fakes de porta descrito na Seção 3.7.2c do TCC.
 */
jest.mock("../repositories/UserRepository")

import { UserModel } from "./UserModel"
import { UserRepository } from "../repositories/UserRepository"
import { User } from "./User"

const repository = UserRepository.prototype as jest.Mocked<UserRepository>

const existingUser: User = {
  id: "id-1",
  name: "João",
  email: "joao@email.com",
  created_at: new Date("2026-01-01T00:00:00Z"),
}

describe("UserModel", () => {
  let model: UserModel

  beforeEach(() => {
    jest.resetAllMocks()
    model = new UserModel()
  })

  describe("create", () => {
    it("deve criar um usuário quando o e-mail não está cadastrado", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      const user = await model.create("João", "joao@email.com")

      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
      expect(user.id).toBeTruthy()
      expect(user.created_at).toBeInstanceOf(Date)
      expect(repository.create).toHaveBeenCalledTimes(1)
    })

    it("deve normalizar o e-mail e remover espaços do nome", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      const user = await model.create("  João  ", "  JOAO@Email.com  ")

      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
    })

    // RN01
    it("deve lançar erro 409 quando o e-mail já está cadastrado", async () => {
      repository.findByEmail.mockResolvedValue(existingUser)

      await expect(model.create("Outro", "joao@email.com"))
        .rejects.toMatchObject({ message: "E-mail já cadastrado", status: 409 })

      expect(repository.create).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando o nome tem menos de 2 caracteres", async () => {
      await expect(model.create("J", "joao@email.com"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando o e-mail tem formato inválido", async () => {
      await expect(model.create("João", "joao-email"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe("findById", () => {
    it("deve retornar o usuário quando ele existe", async () => {
      repository.findById.mockResolvedValue(existingUser)

      await expect(model.findById("id-1")).resolves.toEqual(existingUser)
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.findById("id-inexistente"))
        .rejects.toMatchObject({ message: "Usuário não encontrado", status: 404 })
    })
  })

  describe("update", () => {
    it("deve atualizar quando o usuário mantém o próprio e-mail", async () => {
      repository.findById.mockResolvedValue(existingUser)
      repository.findByEmail.mockResolvedValue(existingUser)
      repository.update.mockResolvedValue({ ...existingUser, name: "João Silva" })

      const user = await model.update("id-1", "João Silva", "joao@email.com")

      expect(user.name).toBe("João Silva")
      expect(repository.update).toHaveBeenCalledWith("id-1", "João Silva", "joao@email.com")
    })

    // RN01
    it("deve lançar erro 409 quando o e-mail pertence a outro usuário", async () => {
      repository.findById.mockResolvedValue(existingUser)
      repository.findByEmail.mockResolvedValue({ ...existingUser, id: "id-2" })

      await expect(model.update("id-1", "João", "maria@email.com"))
        .rejects.toMatchObject({ status: 409 })

      expect(repository.update).not.toHaveBeenCalled()
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.update("id-inexistente", "João", "joao@email.com"))
        .rejects.toMatchObject({ status: 404 })
    })
  })

  describe("delete", () => {
    it("deve deletar o usuário quando ele existe", async () => {
      repository.findById.mockResolvedValue(existingUser)

      await model.delete("id-1")

      expect(repository.delete).toHaveBeenCalledWith("id-1")
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.delete("id-inexistente"))
        .rejects.toMatchObject({ status: 404 })

      expect(repository.delete).not.toHaveBeenCalled()
    })
  })
})
