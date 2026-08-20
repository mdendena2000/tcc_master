import { randomUUID } from "crypto"
import { BoardRepository } from "../repositories/BoardRepository"
import { UserRepository } from "../repositories/UserRepository"
import { Board } from "./Board"
import { ConflictError, NotFoundError } from "./errors"
import { validateText, validateUuid } from "./validators"

const NAME_MIN_LENGTH = 3

export class BoardModel {
  private repository = new BoardRepository()
  private userRepository = new UserRepository()

  async create(name: string, ownerId: string): Promise<Board> {
    const validName = validateText(name, "name", NAME_MIN_LENGTH)
    const validOwnerId = validateUuid(ownerId, "owner_id")

    if (!(await this.userRepository.findById(validOwnerId))) {
      throw new NotFoundError("Usuário não encontrado")
    }

    return this.repository.create({
      id: randomUUID(),
      name: validName,
      owner_id: validOwnerId,
      created_at: new Date(),
    })
  }

  async findAll(): Promise<Board[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<Board> {
    const board = await this.repository.findById(validateUuid(id, "id"))
    if (!board) throw new NotFoundError("Quadro não encontrado")
    return board
  }

  async delete(id: string): Promise<void> {
    const board = await this.findById(id)

    if ((await this.repository.countActiveTasks(board.id)) > 0) {
      throw new ConflictError(
        "O quadro possui tarefas pendentes ou em andamento e não pode ser excluído"
      )
    }

    await this.repository.delete(board.id)
  }
}