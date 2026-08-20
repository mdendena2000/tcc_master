import { Request, Response } from "express"
import { TaskModel } from "../models/TaskModel"
import { TaskStatus, TASK_STATUSES } from "../models/Task"
import { AppError, ConflictError } from "../models/errors"
import { validateEnum } from "../models/validators"

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "done",
  done: null,
}

export class TaskController {
  private model = new TaskModel()

  async create(req: Request, res: Response) {
    try {
      const task = await this.model.create(req.body)
      return res.status(201).json(task)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const tasks = await this.model.findAll(req.query.board_id)
      return res.status(200).json(tasks)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const task = await this.model.findById(req.params.id as string)
      return res.status(200).json(task)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async update(req: Request, res: Response) {
    try {
      const task = await this.model.update(req.params.id as string, req.body)
      return res.status(200).json(task)
    } catch (error) {
      return this.handleError(error, res)
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const status = validateEnum(req.body.status, "status", TASK_STATUSES)
      const task = await this.model.findById(req.params.id as string)

      if (NEXT_STATUS[task.status] !== status) {
        throw new ConflictError(
          `Transição de status inválida: ${task.status} -> ${status}`
        )
      }

      const updated = await this.model.saveStatus(task, status)
      return res.status(200).json(updated)
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