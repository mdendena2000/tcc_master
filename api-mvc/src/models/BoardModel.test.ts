jest.mock("../repositories/BoardRepository")
jest.mock("../repositories/UserRepository")

import { BoardModel } from "./BoardModel"
import { BoardRepository } from "../repositories/BoardRepository"
import { UserRepository } from "../repositories/UserRepository"
import { Board } from "./Board"
import { User } from "./User"

const boardRepository = BoardRepository.prototype as jest.Mocked<BoardRepository>
const userRepository = UserRepository.prototype as jest.Mocked<UserRepository>

const OWNER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
const BOARD_ID = "9c858901-8a57-4791-81fe-4c455b099bc9"

const owner: User = {
  id: OWNER_ID,
  name: "João",
  email: "joao@email.com",
  admin: false,
  created_at: new Date("2026-01-01T00:00:00Z"),
}

const existingBoard: Board = {
  id: BOARD_ID,
  name: "Sprint 1",
  owner_id: OWNER_ID,
  created_at: new Date("2026-01-02T00:00:00Z"),
}

describe("BoardModel", () => {
  let model: BoardModel

  beforeEach(() => {
    jest.resetAllMocks()
    model = new BoardModel()
  })

  describe("create", () => {
    it("deve criar um quadro quando o proprietário existe", async () => {
      userRepository.findById.mockResolvedValue(owner)
      boardRepository.create.mockImplementation(async (board) => board)

      const board = await model.create("Sprint 1", OWNER_ID)

      expect(board.name).toBe("Sprint 1")
      expect(board.owner_id).toBe(OWNER_ID)
      expect(board.id).toBeTruthy()
      expect(board.created_at).toBeInstanceOf(Date)
    })

    it("deve remover espaços nas bordas do nome", async () => {
      userRepository.findById.mockResolvedValue(owner)
      boardRepository.create.mockImplementation(async (board) => board)

      const board = await model.create("  Sprint 1  ", OWNER_ID)

      expect(board.name).toBe("Sprint 1")
    })

    it("deve lançar erro 400 quando o nome tem menos de 3 caracteres", async () => {
      await expect(model.create("AB", OWNER_ID))
        .rejects.toMatchObject({ status: 400 })

      expect(userRepository.findById).not.toHaveBeenCalled()
    })

    it("deve lançar erro 400 quando o owner_id não é um UUID válido", async () => {
      await expect(model.create("Sprint 1", "nao-e-uuid"))
        .rejects.toMatchObject({ status: 400 })

      expect(userRepository.findById).not.toHaveBeenCalled()
    })

    it("deve lançar erro 404 quando o proprietário não existe", async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(model.create("Sprint 1", OWNER_ID))
        .rejects.toMatchObject({ message: "Usuário não encontrado", status: 404 })

      expect(boardRepository.create).not.toHaveBeenCalled()
    })
  })

  describe("findById", () => {
    it("deve retornar o quadro quando ele existe", async () => {
      boardRepository.findById.mockResolvedValue(existingBoard)

      await expect(model.findById(BOARD_ID)).resolves.toEqual(existingBoard)
    })

    it("deve lançar erro 404 quando o quadro não existe", async () => {
      boardRepository.findById.mockResolvedValue(null)

      await expect(model.findById(BOARD_ID))
        .rejects.toMatchObject({ message: "Quadro não encontrado", status: 404 })
    })

    it("deve lançar erro 400 quando o id não é um UUID válido", async () => {
      await expect(model.findById("nao-e-uuid"))
        .rejects.toMatchObject({ status: 400 })

      expect(boardRepository.findById).not.toHaveBeenCalled()
    })
  })

  describe("delete", () => {
    it("deve excluir o quadro quando não há tarefas pendentes", async () => {
      boardRepository.findById.mockResolvedValue(existingBoard)
      boardRepository.countActiveTasks.mockResolvedValue(0)

      await model.delete(BOARD_ID)

      expect(boardRepository.delete).toHaveBeenCalledWith(BOARD_ID)
    })

    // RN04
    it("deve lançar erro 409 quando o quadro possui tarefas todo ou in_progress", async () => {
      boardRepository.findById.mockResolvedValue(existingBoard)
      boardRepository.countActiveTasks.mockResolvedValue(2)

      await expect(model.delete(BOARD_ID))
        .rejects.toMatchObject({ status: 409 })

      expect(boardRepository.delete).not.toHaveBeenCalled()
    })

    it("deve lançar erro 404 quando o quadro não existe", async () => {
      boardRepository.findById.mockResolvedValue(null)

      await expect(model.delete(BOARD_ID))
        .rejects.toMatchObject({ status: 404 })

      expect(boardRepository.countActiveTasks).not.toHaveBeenCalled()
      expect(boardRepository.delete).not.toHaveBeenCalled()
    })
  })
})