jest.mock("../models/TaskModel")

import { Request, Response } from "express"
import { TaskController } from "./TaskController"
import { TaskModel } from "../models/TaskModel"
import { Task, TaskStatus } from "../models/Task"

const model = TaskModel.prototype as jest.Mocked<TaskModel>

const TASK_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"

function taskWithStatus(status: TaskStatus): Task {
  return {
    id: TASK_ID,
    title: "Escrever capítulo 4",
    description: null,
    status,
    priority: "medium",
    board_id: "9c858901-8a57-4791-81fe-4c455b099bc9",
    assignee_id: null,
    created_at: new Date("2026-01-02T00:00:00Z"),
    updated_at: new Date("2026-01-02T00:00:00Z"),
  }
}

function mockResponse() {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

function mockRequest(status: unknown) {
  return { params: { id: TASK_ID }, body: { status } } as unknown as Request
}

describe("TaskController.updateStatus (RN02)", () => {
  let controller: TaskController

  beforeEach(() => {
    jest.resetAllMocks()
    controller = new TaskController()
    model.saveStatus.mockImplementation(async (task, status) => ({
      ...task,
      status,
    }))
  })

  describe("transições permitidas", () => {
    it.each([
      ["todo", "in_progress"],
      ["in_progress", "done"],
    ] as [TaskStatus, TaskStatus][])(
      "deve permitir avançar de %s para %s",
      async (from, to) => {
        model.findById.mockResolvedValue(taskWithStatus(from))
        const res = mockResponse()

        await controller.updateStatus(mockRequest(to), res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: to }))
      }
    )
  })

  describe("transições bloqueadas", () => {
    it.each([
      ["todo", "done", "salto de etapa"],
      ["in_progress", "todo", "retrocesso"],
      ["done", "in_progress", "retrocesso"],
      ["done", "todo", "retrocesso"],
      ["todo", "todo", "mesmo status"],
      ["in_progress", "in_progress", "mesmo status"],
      ["done", "done", "status final"],
    ] as [TaskStatus, TaskStatus, string][])(
      "deve bloquear %s -> %s (%s)",
      async (from, to) => {
        model.findById.mockResolvedValue(taskWithStatus(from))
        const res = mockResponse()

        await controller.updateStatus(mockRequest(to), res)

        expect(res.status).toHaveBeenCalledWith(409)
        expect(model.saveStatus).not.toHaveBeenCalled()
      }
    )
  })

  it("deve responder 400 quando o status informado não pertence ao enum", async () => {
    const res = mockResponse()

    await controller.updateStatus(mockRequest("arquivada"), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(model.findById).not.toHaveBeenCalled()
  })

  it("deve responder 404 quando a tarefa não existe", async () => {
    const { NotFoundError } = jest.requireActual("../models/errors")
    model.findById.mockRejectedValue(new NotFoundError("Tarefa não encontrada"))
    const res = mockResponse()

    await controller.updateStatus(mockRequest("in_progress"), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})