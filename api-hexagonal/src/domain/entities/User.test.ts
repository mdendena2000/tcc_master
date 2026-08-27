/**
 * Testes da entidade User (Hexagonal).
 *
 * A entidade não depende de nada: nenhum import de infraestrutura, nenhum
 * jest.mock, nenhum dublê. As invariantes da Tabela 9 são exercitadas por
 * chamada direta.
 *
 * No MVC equivalente não existe arquivo correspondente: como User é apenas
 * uma interface de dados, suas restrições só podem ser verificadas através do
 * UserModel, que exige interceptar o módulo do repositório (Seção 3.7.2c).
 */
import { User } from "./User"

describe("User", () => {
  describe("create", () => {
    it("deve criar um usuário válido", () => {
      const user = User.create({ name: "João", email: "joao@email.com", password: "senha123" })

      expect(user.id).toBeTruthy()
      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
      expect(user.admin).toBe(false)
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it("deve remover espaços do nome e normalizar o e-mail", () => {
      const user = User.create({ name: "  João  ", email: "  JOAO@Email.com  ", password: "senha123" })

      expect(user.name).toBe("João")
      expect(user.email).toBe("joao@email.com")
    })

    it("deve aceitar admin true", () => {
      const user = User.create({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
        admin: true,
      })

      expect(user.admin).toBe(true)
    })

    it("deve recusar nome com menos de 2 caracteres", () => {
      expect(() => User.create({ name: "J", email: "joao@email.com", password: "senha123" }))
        .toThrow("O campo name deve possuir no mínimo 2 caracteres")
    })

    it("deve recusar e-mail em formato inválido", () => {
      expect(() => User.create({ name: "João", email: "sem-arroba", password: "senha123" }))
        .toThrow("E-mail em formato inválido")
    })

    it("deve recusar admin não booleano", () => {
      expect(() =>
        User.create({
          name: "João",
          email: "joao@email.com",
          password: "senha123",
          admin: "sim",
        })
      ).toThrow("O campo admin deve ser true ou false")
    })

    it("deve recusar senha com menos de 6 caracteres", () => {
      expect(() =>
        User.create({ name: "João", email: "joao@email.com", password: "12345" })
      ).toThrow("O campo password deve possuir no mínimo 6 caracteres")
    })

    it("deve recusar senha ausente", () => {
      expect(() =>
        User.create({ name: "João", email: "joao@email.com", password: undefined })
      ).toThrow()
    })

    it("não deve guardar a senha em texto", () => {
      const user = User.create({
        name: "João",
        email: "joao@email.com",
        password: "senha123",
      })

      expect(user.passwordHash).not.toContain("senha123")
      expect(user.passwordHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    })

    it("deve gerar hashes distintos para a mesma senha", () => {
      const a = User.create({ name: "Ana", email: "a@email.com", password: "senha123" })
      const b = User.create({ name: "Bia", email: "b@email.com", password: "senha123" })

      expect(a.passwordHash).not.toBe(b.passwordHash)
    })

    it("deve gerar identificadores distintos", () => {
      const primeiro = User.create({ name: "João", email: "a@email.com", password: "senha123" })
      const segundo = User.create({ name: "Maria", email: "b@email.com", password: "senha123" })

      expect(primeiro.id).not.toBe(segundo.id)
    })
  })

  describe("restore", () => {
    it("deve reconstituir sem revalidar", () => {
      const createdAt = new Date("2026-01-01T00:00:00Z")
      const user = User.restore({
        id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        name: "João",
        email: "joao@email.com",
        admin: true,
        passwordHash: "salt:hash",
        createdAt,
      })

      expect(user.id).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301")
      expect(user.admin).toBe(true)
      expect(user.createdAt).toBe(createdAt)
    })
  })

  describe("alterações de estado", () => {
    let user: User

    beforeEach(() => {
      user = User.create({ name: "João", email: "joao@email.com", password: "senha123" })
    })

    it("deve renomear", () => {
      user.rename("João Silva")
      expect(user.name).toBe("João Silva")
    })

    it("deve recusar renomear para um nome curto", () => {
      expect(() => user.rename("J")).toThrow()
      expect(user.name).toBe("João")
    })

    it("deve alterar o e-mail normalizando", () => {
      user.changeEmail("NOVO@Email.com")
      expect(user.email).toBe("novo@email.com")
    })

    it("deve recusar e-mail inválido mantendo o anterior", () => {
      expect(() => user.changeEmail("invalido")).toThrow()
      expect(user.email).toBe("joao@email.com")
    })

    it("deve promover a admin", () => {
      user.changeAdmin(true)
      expect(user.admin).toBe(true)
    })

    it("deve autenticar com a senha correta", () => {
      expect(user.authenticate("senha123")).toBe(true)
    })

    it("deve recusar senha incorreta", () => {
      expect(user.authenticate("errada")).toBe(false)
      expect(user.authenticate(undefined)).toBe(false)
      expect(user.authenticate(123)).toBe(false)
    })

    it("deve trocar a senha", () => {
      user.changePassword("novaSenha456")

      expect(user.authenticate("novaSenha456")).toBe(true)
      expect(user.authenticate("senha123")).toBe(false)
    })

    it("deve recusar troca por senha curta mantendo a anterior", () => {
      expect(() => user.changePassword("123")).toThrow()
      expect(user.authenticate("senha123")).toBe(true)
    })

    it("deve preservar o perfil quando admin é omitido", () => {
      user.changeAdmin(true)
      user.changeAdmin(undefined)
      expect(user.admin).toBe(true)
    })
  })
})
