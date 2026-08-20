/**
 * Testes da entidade Board (Hexagonal), sem qualquer dependência externa.
 */
import { Board } from "./Board"

const OWNER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"

describe("Board", () => {
  describe("create", () => {
    it("deve criar um quadro válido", () => {
      const board = Board.create({ name: "Sprint 1", ownerId: OWNER_ID })

      expect(board.id).toBeTruthy()
      expect(board.name).toBe("Sprint 1")
      expect(board.ownerId).toBe(OWNER_ID)
      expect(board.createdAt).toBeInstanceOf(Date)
    })

    it("deve remover espaços nas bordas do nome", () => {
      const board = Board.create({ name: "  Sprint 1  ", ownerId: OWNER_ID })
      expect(board.name).toBe("Sprint 1")
    })

    it("deve recusar nome com menos de 3 caracteres", () => {
      expect(() => Board.create({ name: "AB", ownerId: OWNER_ID }))
        .toThrow("O campo name deve possuir no mínimo 3 caracteres")
    })

    it("deve recusar owner_id que não seja UUID", () => {
      expect(() => Board.create({ name: "Sprint 1", ownerId: "abc" }))
        .toThrow("O campo owner_id deve ser um UUID válido")
    })
  })

  describe("restore", () => {
    it("deve reconstituir sem revalidar", () => {
      const createdAt = new Date("2026-01-02T00:00:00Z")
      const board = Board.restore({
        id: "9c858901-8a57-4791-81fe-4c455b099bc9",
        name: "Sprint 1",
        ownerId: OWNER_ID,
        createdAt,
      })

      expect(board.id).toBe("9c858901-8a57-4791-81fe-4c455b099bc9")
      expect(board.name).toBe("Sprint 1")
      expect(board.createdAt).toBe(createdAt)
    })
  })

  describe("rename", () => {
    it("deve renomear", () => {
      const board = Board.create({ name: "Sprint 1", ownerId: OWNER_ID })
      board.rename("Sprint 2")
      expect(board.name).toBe("Sprint 2")
    })

    it("deve recusar nome curto mantendo o anterior", () => {
      const board = Board.create({ name: "Sprint 1", ownerId: OWNER_ID })
      expect(() => board.rename("AB")).toThrow()
      expect(board.name).toBe("Sprint 1")
    })
  })
})
