import { Board } from "../../../domain/entities/Board"
import { NotFoundError } from "../../../domain/errors"
import { requireUuid } from "../../../domain/validation"
import { BoardRepository } from "../../ports/BoardRepository"

export class GetBoardById {
  constructor(private readonly boards: BoardRepository) {}

  async execute(id: unknown): Promise<Board> {
    const board = await this.boards.findById(requireUuid(id, "id"))
    if (!board) throw new NotFoundError("Quadro não encontrado")
    return board
  }
}
