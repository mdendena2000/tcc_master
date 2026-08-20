jest.mock("../repositories/TaskRepository")
jest.mock("../repositories/BoardRepository")
jest.mock("../repositories/UserRepository")

import { TaskModel } from "./TaskModel"
import { TaskRepository } from "../repositories/TaskRepository"
import { BoardRepository } from "../repositories/BoardRepository"
import { UserRepository } from "../repositories/UserRepository"
import { Task } from "./Task"
import { Board } from "./Board"
import { User } from "./User"

const taskRepository = TaskRepository.prototype as jest.Mocked<TaskRepository>
const boardRepository = BoardRepository.prototype as jest.Mocked<BoardRepository>
const userRepository = UserRepository.prototype as jest.Mocked<UserRepository>

const BOARD_ID = "9c858901-8a57-4791-81fe-4c455b099bc9"
const TASK_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
const ASSIGNEE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"

const board: Board = {
  id: BOARD_ID,
  name: "Sprint 1",
  owner_id: ASSIGNEE_ID,
  created_at: new Date("2026-01-01T00:00:00Z"),
}

const assignee: User = {
  id: ASSIGNEE_ID,
  name: "João",
  email: "joao@email.com",
  admin: false,
  created_at: new Date("2026-01-01T00:00:00Z"),
}

const existingTask: Task = {
  id: TASK_ID,
  title: "Escrever capítulo 4",
  description: null,
  status: "todo",
  priority: "medium",
  board_id: BOARD_ID,
  assignee_id: null,
  created_at: new Date("2026-01-02T00:00:00Z"),
  updated_at: new Date("2026-01-02T00:00:00Z"),
}

describe("TaskModel", () => {
  let model: TaskModel

  beforeEach(() => {
    jest.resetAllMocks()
    model = new TaskModel()
  })

  describe("create", () => {
    beforeEach(() => {
      boardRepository.findById.mockResolvedValue(board)
      taskRepository.findByTitleInBoard.mockResolvedValue(null)
      taskRepository.create.mockImplementation(async (task) => task)
    })

    it("deve criar a tarefa com status todo e prioridade medium por padrão", async () => {
      const task = await model.create({
        title: "Escrever capítulo 4",
        board_id: BOARD_ID,
      })

      expect(task.status).toBe("todo")
      expect(task.priority).toBe("medium")
      expect(task.description).toBeNull()
      expect(task.assignee_id).toBeNull()
      expect(task.board_id).toBe(BOARD_ID)
    })

    it("deve aceitar description, priority e assignee informados", async () => {
      userRepository.findById.mockResolvedValue(assignee)

      const task = await model.create({
        title: "Revisar metodologia",
        description: "  Capítulo 3  ",
        priority: "high",
        board_id: BOARD_ID,
        assignee_id: ASSIGNEE_ID,
      })

      expect(task.description).toBe("Capítulo 3")
      expect(task.priority).toBe("high")
      expect(task.assignee_id).toBe(ASSIGNEE_ID)
    })

    it("deve lançar erro 400 quando o título tem menos de 3 caracteres", async () => {
      await expect(model.create({ title: "AB", board_id: BOARD_ID }))
        .rejects.toMatchObject({ status: 400 })
    })

    it("deve lançar erro 400 quando a prioridade é inválida", async () => {
      await expect(
        model.create({ title: "Tarefa", board_id: BOARD_ID, priority: "urgente" })
      ).rejects.toMatchObject({ status: 400 })
    })

    it("deve lançar erro 404 quando o quadro não existe", async () => {
      boardRepository.findById.mockResolvedValue(null)

      await expect(model.create({ title: "Tarefa", board_id: BOARD_ID }))
        .rejects.toMatchObject({ message: "Quadro não encontrado", status: 404 })

      expect(taskRepository.create).not.toHaveBeenCalled()
    })

    // RN03
    it("deve lançar erro 404 quando o responsável não existe", async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        model.create({ title: "Tarefa", board_id: BOARD_ID, assignee_id: ASSIGNEE_ID })
      ).rejects.toMatchObject({ message: "Usuário responsável não encontrado", status: 404 })

      expect(taskRepository.create).not.toHaveBeenCalled()
    })

    // RN05
    it("deve lançar erro 409 quando já existe tarefa com o mesmo título no quadro", async () => {
      taskRepository.findByTitleInBoard.mockResolvedValue(existingTask)

      await expect(model.create({ title: "Escrever capítulo 4", board_id: BOARD_ID }))
        .rejects.toMatchObject({ status: 409 })

      expect(taskRepository.create).not.toHaveBeenCalled()
    })
  })

  describe("findAll", () => {
    it("deve listar todas as tarefas quando não há filtro", async () => {
      taskRepository.findAll.mockResolvedValue([existingTask])

      await model.findAll()

      expect(taskRepository.findAll).toHaveBeenCalledWith()
    })

    it("deve filtrar por board_id quando informado", async () => {
      taskRepository.findAll.mockResolvedValue([existingTask])

      await model.findAll(BOARD_ID)

      expect(taskRepository.findAll).toHaveBeenCalledWith(BOARD_ID)
    })

    it("deve lançar erro 400 quando o board_id do filtro é malformado", async () => {
      await expect(model.findAll("nao-e-uuid"))
        .rejects.toMatchObject({ status: 400 })
    })
  })

  describe("findById", () => {
    it("deve retornar a tarefa quando ela existe", async () => {
      taskRepository.findById.mockResolvedValue(existingTask)

      await expect(model.findById(TASK_ID)).resolves.toEqual(existingTask)
    })

    it("deve lançar erro 404 quando a tarefa não existe", async () => {
      taskRepository.findById.mockResolvedValue(null)

      await expect(model.findById(TASK_ID))
        .rejects.toMatchObject({ message: "Tarefa não encontrada", status: 404 })
    })
  })

  describe("update", () => {
    beforeEach(() => {
      taskRepository.findById.mockResolvedValue(existingTask)
      taskRepository.findByTitleInBoard.mockResolvedValue(null)
      taskRepository.update.mockImplementation(async (id, fields) => ({
        ...existingTask,
        ...fields,
      }))
    })

    it("deve atualizar os campos da tarefa", async () => {
      const task = await model.update(TASK_ID, {
        title: "Título revisado",
        priority: "low",
      })

      expect(task.title).toBe("Título revisado")
      expect(task.priority).toBe("low")
    })

    // RN05
    it("deve permitir manter o próprio título", async () => {
      taskRepository.findByTitleInBoard.mockResolvedValue(existingTask)

      await expect(
        model.update(TASK_ID, { title: "Escrever capítulo 4" })
      ).resolves.toBeDefined()
    })

    // RN05
    it("deve lançar erro 409 quando o título pertence a outra tarefa do quadro", async () => {
      taskRepository.findByTitleInBoard.mockResolvedValue({
        ...existingTask,
        id: "0f8fad5b-d9cb-469f-a165-70867728950e",
      })

      await expect(model.update(TASK_ID, { title: "Escrever capítulo 4" }))
        .rejects.toMatchObject({ status: 409 })

      expect(taskRepository.update).not.toHaveBeenCalled()
    })

    it("deve lançar erro 404 quando a tarefa não existe", async () => {
      taskRepository.findById.mockResolvedValue(null)

      await expect(model.update(TASK_ID, { title: "Qualquer título" }))
        .rejects.toMatchObject({ status: 404 })
    })
  })

  describe("delete", () => {
    it("deve excluir a tarefa quando ela existe", async () => {
      taskRepository.findById.mockResolvedValue(existingTask)

      await model.delete(TASK_ID)

      expect(taskRepository.delete).toHaveBeenCalledWith(TASK_ID)
    })

    it("deve lançar erro 404 quando a tarefa não existe", async () => {
      taskRepository.findById.mockResolvedValue(null)

      await expect(model.delete(TASK_ID)).rejects.toMatchObject({ status: 404 })

      expect(taskRepository.delete).not.toHaveBeenCalled()
    })
  })
})