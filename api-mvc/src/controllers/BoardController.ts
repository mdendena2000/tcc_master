import { Request, Response } from "express"
import { BoardModel } from "../models/BoardModel"
import { AppError } from "../models/errors"

/**
 * Controller do recurso Boards (Tabela 13 do TCC).
 */
export class BoardController {
  private model = new BoardModel()

  async create(req: Request, res: Response) {
    try {
      const { name, owner_id } = req.body
      const board = await this.model.create(name, owner_id)
      return res.status(201).json(board)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findAll(_req: Request, res: Response) {
    try {
      const boards = await this.model.findAll()
      return res.status(200).json(boards)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const board = await this.model.findById(req.params.id as string)
      return res.status(200).json(board)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.model.delete(req.params.id as string)
      return res.status(204).send()
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ message: error.message })
    }
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}