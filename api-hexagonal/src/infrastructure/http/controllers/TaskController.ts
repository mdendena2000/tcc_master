import { Request, Response } from "express"
import { ChangeTaskStatus } from "../../../application/use-cases/task/ChangeTaskStatus"
import { CreateTask } from "../../../application/use-cases/task/CreateTask"
import { DeleteTask } from "../../../application/use-cases/task/DeleteTask"
import { GetTaskById } from "../../../application/use-cases/task/GetTaskById"
import { ListTasks } from "../../../application/use-cases/task/ListTasks"
import { UpdateTask } from "../../../application/use-cases/task/UpdateTask"
import { sendError } from "../errorMapper"
import { TaskPresenter } from "../presenters/TaskPresenter"

export class TaskController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly listTasks: ListTasks,
    private readonly getTaskById: GetTaskById,
    private readonly updateTask: UpdateTask,
    private readonly changeTaskStatus: ChangeTaskStatus,
    private readonly deleteTask: DeleteTask
  ) {}

  async create(req: Request, res: Response) {
    try {
      const task = await this.createTask.execute(req.body)
      return res.status(201).json(TaskPresenter.toJSON(task))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const tasks = await this.listTasks.execute(req.query.board_id)
      return res.status(200).json(TaskPresenter.toJSONList(tasks))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const task = await this.getTaskById.execute(req.params.id)
      return res.status(200).json(TaskPresenter.toJSON(task))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async update(req: Request, res: Response) {
    try {
      const task = await this.updateTask.execute(req.params.id, req.body)
      return res.status(200).json(TaskPresenter.toJSON(task))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const task = await this.changeTaskStatus.execute(
        req.params.id,
        req.body.status
      )
      return res.status(200).json(TaskPresenter.toJSON(task))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.deleteTask.execute(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return sendError(error, res)
    }
  }
}
