import { Request, Response } from "express"
import { UserModel } from "../models/UserModel"
import { AppError } from "../models/errors"

/**
 * Controller do recurso Users (Tabela 12 do TCC).
 *
 * No MVC adaptado a APIs REST, a camada View é substituída pela serialização
 * das respostas em JSON, realizada aqui.
 */
export class UserController {
  private model = new UserModel()

  async create(req: Request, res: Response) {
    try {
      const { name, email, admin } = req.body
      const user = await this.model.create(name, email, admin)
      return res.status(201).json(user)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findAll(_req: Request, res: Response) {
    try {
      const users = await this.model.findAll()
      return res.status(200).json(users)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const user = await this.model.findById(req.params.id as string)
      return res.status(200).json(user)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { name, email, admin } = req.body
      const user = await this.model.update(
        req.params.id as string,
        name,
        email,
        admin
      )
      return res.status(200).json(user)
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