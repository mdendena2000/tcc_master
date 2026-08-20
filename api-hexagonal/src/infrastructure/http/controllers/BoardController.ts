import { Request, Response } from "express"
import { CreateBoard } from "../../../application/use-cases/board/CreateBoard"
import { DeleteBoard } from "../../../application/use-cases/board/DeleteBoard"
import { GetBoardById } from "../../../application/use-cases/board/GetBoardById"
import { ListBoards } from "../../../application/use-cases/board/ListBoards"
import { sendError } from "../errorMapper"
import { BoardPresenter } from "../presenters/BoardPresenter"

/**
 * Adaptador primário (inbound) do recurso Boards (Tabela 13 do TCC).
 */
export class BoardController {
  constructor(
    private readonly createBoard: CreateBoard,
    private readonly listBoards: ListBoards,
    private readonly getBoardById: GetBoardById,
    private readonly deleteBoard: DeleteBoard
  ) {}

  async create(req: Request, res: Response) {
    try {
      const board = await this.createBoard.execute(req.body)
      return res.status(201).json(BoardPresenter.toJSON(board))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findAll(_req: Request, res: Response) {
    try {
      const boards = await this.listBoards.execute()
      return res.status(200).json(BoardPresenter.toJSONList(boards))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const board = await this.getBoardById.execute(req.params.id)
      return res.status(200).json(BoardPresenter.toJSON(board))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.deleteBoard.execute(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return sendError(error, res)
    }
  }
}
