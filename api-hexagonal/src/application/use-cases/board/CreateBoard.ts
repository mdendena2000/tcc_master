import { Board } from "../../../domain/entities/Board"
import { NotFoundError } from "../../../domain/errors"
import { BoardRepository } from "../../ports/BoardRepository"
import { UserRepository } from "../../ports/UserRepository"

interface CreateBoardInput {
  name: unknown
  owner_id: unknown
}

/**
 * Cria um quadro verificando a existência do proprietário.
 *
 * Depende de duas portas — a de quadros e a de usuários — recebidas por
 * injeção. Nenhuma implementação concreta é conhecida aqui.
 */
export class CreateBoard {
  constructor(
    private readonly boards: BoardRepository,
    private readonly users: UserRepository
  ) {}

  async execute(input: CreateBoardInput): Promise<Board> {
    const board = Board.create({ name: input.name, ownerId: input.owner_id })

    // owner_id é chave estrangeira para User (Tabela 10)
    if (!(await this.users.findById(board.ownerId))) {
      throw new NotFoundError("Usuário não encontrado")
    }

    await this.boards.save(board)
    return board
  }
}
