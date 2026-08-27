jest.mock("../repositories/UserRepository")

import { UserModel } from "./UserModel"
import { UserRepository } from "../repositories/UserRepository"
import { User } from "./User"
import { hashPassword } from "./password"

const repository = UserRepository.prototype as jest.Mocked<UserRepository>

const USER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
const OTHER_ID = "9c858901-8a57-4791-81fe-4c455b099bc9"

const existingUser: User = {
  id: USER_ID,
  name: "João",
  email: "joao@email.com",
  admin: false,
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

      const user = await model.create("João", "joao@email.com", "senha123")

      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
      expect(user.id).toBeTruthy()
      expect(user.created_at).toBeInstanceOf(Date)
      expect(repository.create).toHaveBeenCalledTimes(1)
    })

    it("deve normalizar o e-mail e remover espaços do nome", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      const user = await model.create("  João  ", "  JOAO@Email.com  ", "senha123")

      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
    })

    // RN01
    it("deve lançar erro 409 quando o e-mail já está cadastrado", async () => {
      repository.findByEmail.mockResolvedValue(existingUser)

      await expect(model.create("Outro", "joao@email.com", "senha123"))
        .rejects.toMatchObject({ message: "E-mail já cadastrado", status: 409 })

      expect(repository.create).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando o nome tem menos de 2 caracteres", async () => {
      await expect(model.create("J", "joao@email.com", "senha123"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando o e-mail tem formato inválido", async () => {
      await expect(model.create("João", "joao-email", "senha123"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it("deve criar com admin false por padrão", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      const user = await model.create("João", "joao@email.com", "senha123")

      expect(user.admin).toBe(false)
    })

    it("deve criar com admin true quando informado", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      const user = await model.create("João", "joao@email.com", "senha123", true)

      expect(user.admin).toBe(true)
    })

    it("deve lançar erro 400 quando admin não é booleano", async () => {
      await expect(model.create("João", "joao@email.com", "senha123", "sim"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando a senha tem menos de 6 caracteres", async () => {
      await expect(model.create("João", "joao@email.com", "12345"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando a senha não é informada", async () => {
      await expect(model.create("João", "joao@email.com", undefined))
        .rejects.toMatchObject({ status: 400 })
    })

    it("deve persistir o hash da senha, nunca o valor em texto", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      await model.create("João", "joao@email.com", "senha123")

      const [, hash] = repository.create.mock.calls[0]
      expect(hash).not.toContain("senha123")
      expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    })

    it("deve gerar hashes distintos para a mesma senha", async () => {
      repository.findByEmail.mockResolvedValue(null)
      repository.create.mockImplementation(async (user) => user)

      await model.create("João", "a@email.com", "senha123")
      await model.create("Maria", "b@email.com", "senha123")

      const primeiro = repository.create.mock.calls[0][1]
      const segundo = repository.create.mock.calls[1][1]
      expect(primeiro).not.toBe(segundo)
    })
  })

  describe("authenticate", () => {
    // Hash real de "senha123", gerado pelo próprio módulo de senha
    const hashValido = hashPassword("senha123")

    it("deve autenticar com credenciais corretas", async () => {
      repository.findPasswordHashByEmail.mockResolvedValue(hashValido)
      repository.findByEmail.mockResolvedValue(existingUser)

      await expect(model.authenticate("joao@email.com", "senha123"))
        .resolves.toEqual(existingUser)
    })

    it("deve normalizar o e-mail antes de consultar", async () => {
      repository.findPasswordHashByEmail.mockResolvedValue(hashValido)
      repository.findByEmail.mockResolvedValue(existingUser)

      await model.authenticate("  JOAO@Email.com  ", "senha123")

      expect(repository.findPasswordHashByEmail)
        .toHaveBeenCalledWith("joao@email.com")
    })

    it("deve lançar erro 401 quando a senha está incorreta", async () => {
      repository.findPasswordHashByEmail.mockResolvedValue(hashValido)

      await expect(model.authenticate("joao@email.com", "errada"))
        .rejects.toMatchObject({ message: "Credenciais inválidas", status: 401 })
    })

    it("deve lançar erro 401 quando o e-mail não existe", async () => {
      repository.findPasswordHashByEmail.mockResolvedValue(null)

      await expect(model.authenticate("ninguem@email.com", "senha123"))
        .rejects.toMatchObject({ message: "Credenciais inválidas", status: 401 })
    })

    it("deve usar a mesma mensagem para e-mail inexistente e senha errada", async () => {
      repository.findPasswordHashByEmail.mockResolvedValue(null)
      const semEmail = await model.authenticate("x@email.com", "senha123").catch((e) => e)

      repository.findPasswordHashByEmail.mockResolvedValue(hashValido)
      const senhaErrada = await model.authenticate("joao@email.com", "x").catch((e) => e)

      expect(semEmail.message).toBe(senhaErrada.message)
      expect(semEmail.status).toBe(senhaErrada.status)
    })

    it("deve lançar erro 401 quando os campos não são texto", async () => {
      await expect(model.authenticate(123, null))
        .rejects.toMatchObject({ status: 401 })

      expect(repository.findPasswordHashByEmail).not.toHaveBeenCalled()
    })
  })

  describe("findById", () => {
    it("deve retornar o usuário quando ele existe", async () => {
      repository.findById.mockResolvedValue(existingUser)

      await expect(model.findById(USER_ID)).resolves.toEqual(existingUser)
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.findById(USER_ID))
        .rejects.toMatchObject({ message: "Usuário não encontrado", status: 404 })
    })

    it("deve lançar erro 400 quando o id não é um UUID válido", async () => {
      await expect(model.findById("nao-e-uuid"))
        .rejects.toMatchObject({ status: 400 })

      expect(repository.findById).not.toHaveBeenCalled()
    })
  })

  describe("update", () => {
    it("deve atualizar quando o usuário mantém o próprio e-mail", async () => {
      repository.findById.mockResolvedValue(existingUser)
      repository.findByEmail.mockResolvedValue(existingUser)
      repository.update.mockResolvedValue({ ...existingUser, name: "João Silva" })

      const user = await model.update(USER_ID, "João Silva", "joao@email.com")

      expect(user.name).toBe("João Silva")
      expect(repository.update).toHaveBeenCalledWith(
        USER_ID,
        "João Silva",
        "joao@email.com",
        false
      )
    })

    it("deve promover o usuário a admin quando informado", async () => {
      repository.findById.mockResolvedValue(existingUser)
      repository.findByEmail.mockResolvedValue(existingUser)
      repository.update.mockResolvedValue({ ...existingUser, admin: true })

      const user = await model.update(USER_ID, "João", "joao@email.com", true)

      expect(user.admin).toBe(true)
      expect(repository.update).toHaveBeenCalledWith(
        USER_ID,
        "João",
        "joao@email.com",
        true
      )
    })

    it("deve preservar o perfil atual quando admin é omitido", async () => {
      const adminUser = { ...existingUser, admin: true }
      repository.findById.mockResolvedValue(adminUser)
      repository.findByEmail.mockResolvedValue(adminUser)
      repository.update.mockResolvedValue(adminUser)

      await model.update(USER_ID, "João", "joao@email.com")

      expect(repository.update).toHaveBeenCalledWith(
        USER_ID,
        "João",
        "joao@email.com",
        true
      )
    })

    // RN01
    it("deve lançar erro 409 quando o e-mail pertence a outro usuário", async () => {
      repository.findById.mockResolvedValue(existingUser)
      repository.findByEmail.mockResolvedValue({ ...existingUser, id: OTHER_ID })

      await expect(model.update(USER_ID, "João", "maria@email.com"))
        .rejects.toMatchObject({ status: 409 })

      expect(repository.update).not.toHaveBeenCalled()
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.update(USER_ID, "João", "joao@email.com"))
        .rejects.toMatchObject({ status: 404 })
    })
  })

  describe("delete", () => {
    it("deve deletar o usuário quando ele existe", async () => {
      repository.findById.mockResolvedValue(existingUser)

      await model.delete(USER_ID)

      expect(repository.delete).toHaveBeenCalledWith(USER_ID)
    })

    it("deve lançar erro 404 quando o usuário não existe", async () => {
      repository.findById.mockResolvedValue(null)

      await expect(model.delete(USER_ID))
        .rejects.toMatchObject({ status: 404 })

      expect(repository.delete).not.toHaveBeenCalled()
    })
  })
})