import { Request, Response } from "express"
import { UserModel } from "../models/UserModel"
import { AppError } from "../models/errors"

export class UserController {
  private model = new UserModel()

  async create(req: Request, res: Response) {
    try {
      const { name, email, password, admin } = req.body
      const user = await this.model.create(name, email, password, admin)
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
      const { name, email, admin, password } = req.body
      const user = await this.model.update(
        req.params.id as string,
        name,
        email,
        admin,
        password
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

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const user = await this.model.authenticate(email, password)
      return res.status(200).json(user)
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