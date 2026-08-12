import { Request, Response } from "express"
import { TaskModel } from "../models/TaskModel"
import { TaskStatus, TASK_STATUSES } from "../models/Task"
import { AppError, ConflictError } from "../models/errors"
import { validateEnum } from "../models/validators"

/**
 * Sequência permitida de transição de status (RN02):
 * todo -> in_progress -> done. Retrocessos e saltos não são permitidos.
 */
const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "done",
  done: null,
}

/**
 * Controller do recurso Tasks (Tabela 14 do TCC).
 *
 * A RN02 é implementada aqui, e não no Model. Conforme a Seção 4.8, no MVC
 * essa regra "tende a ficar concentrada no Controller", o que a torna
 * dependente do framework HTTP: sua validação exige simular objetos Request e
 * Response, em vez de exercitar a regra diretamente. Esse posicionamento é
 * intencional — é o contraste que o experimento mede em relação à
 * Arquitetura Hexagonal, onde a RN02 é encapsulada no método changeStatus()
 * da entidade Task e testada sem qualquer dependência externa.
 */
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

  /**
   * PATCH /tasks/:id/status — RN02.
   *
   * A regra de transição é avaliada neste método, entre a leitura do corpo da
   * requisição e a montagem da resposta.
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const status = validateEnum(req.body.status, "status", TASK_STATUSES)
      const task = await this.model.findById(req.params.id as string)

      // RN02: o status só pode avançar para o próximo da sequência
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