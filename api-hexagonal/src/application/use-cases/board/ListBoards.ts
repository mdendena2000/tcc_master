import { Board } from "../../../domain/entities/Board"
import { BoardRepository } from "../../ports/BoardRepository"

export class ListBoards {
  constructor(private readonly boards: BoardRepository) {}

  async execute(): Promise<Board[]> {
    return this.boards.findAll()
  }
}
