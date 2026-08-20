/**
 * Testes da RN02 e das invariantes da entidade Task (Hexagonal).
 *
 * Este arquivo é o par direto de TaskController.test.ts do MVC.
 *
 * Aqui a RN02 é invocada diretamente — task.changeStatus("done") — sem
 * servidor HTTP, sem objetos Request e Response simulados, sem jest.mock e
 * sem qualquer dublê. No MVC, a mesma regra vive no Controller e exige duas
 * funções de andaime (mockRequest e mockResponse) e a verificação indireta
 * por meio de res.status(), conforme previsto na Seção 4.8 do TCC.
 */
import { Task } from "./Task"
import { ConflictError } from "../errors"
import { TaskStatus } from "../value-objects/TaskStatus"

const BOARD_ID = "9c858901-8a57-4791-81fe-4c455b099bc9"
const ASSIGNEE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"

/** Constrói uma tarefa já no status desejado, avançando pela própria regra. */
function tarefaEm(status: TaskStatus): Task {
  const task = Task.create({ title: "Escrever capítulo 4", boardId: BOARD_ID })
  if (status === "in_progress" || status === "done") task.changeStatus("in_progress")
  if (status === "done") task.changeStatus("done")
  return task
}

describe("Task", () => {
  describe("create", () => {
    it("deve criar com status todo e prioridade medium por padrão", () => {
      const task = Task.create({ title: "Escrever capítulo 4", boardId: BOARD_ID })

      expect(task.id).toBeTruthy()
      expect(task.status).toBe("todo")
      expect(task.priority).toBe("medium")
      expect(task.description).toBeNull()
      expect(task.assigneeId).toBeNull()
      expect(task.createdAt).toEqual(task.updatedAt)
    })

    it("deve aceitar description, priority e assignee", () => {
      const task = Task.create({
        title: "Revisar metodologia",
        description: "  Capítulo 3  ",
        priority: "high",
        boardId: BOARD_ID,
        assigneeId: ASSIGNEE_ID,
      })

      expect(task.description).toBe("Capítulo 3")
      expect(task.priority).toBe("high")
      expect(task.assigneeId).toBe(ASSIGNEE_ID)
    })

    it("deve recusar título com menos de 3 caracteres", () => {
      expect(() => Task.create({ title: "AB", boardId: BOARD_ID }))
        .toThrow("O campo title deve possuir no mínimo 3 caracteres")
    })

    it("deve recusar prioridade fora do conjunto", () => {
      expect(() =>
        Task.create({ title: "Tarefa", boardId: BOARD_ID, priority: "urgente" })
      ).toThrow("O campo priority deve ser um dos valores: low, medium, high")
    })

    it("deve recusar board_id que não seja UUID", () => {
      expect(() => Task.create({ title: "Tarefa", boardId: "abc" }))
        .toThrow("O campo board_id deve ser um UUID válido")
    })
  })

  // ------------------------------------------------------------------ RN02
  describe("changeStatus (RN02)", () => {
    describe("transições permitidas", () => {
      it.each([
        ["todo", "in_progress"],
        ["in_progress", "done"],
      ] as [TaskStatus, TaskStatus][])("deve avançar de %s para %s", (de, para) => {
        const task = tarefaEm(de)

        task.changeStatus(para)

        expect(task.status).toBe(para)
      })

      it("deve permitir o ciclo completo todo -> in_progress -> done", () => {
        const task = Task.create({ title: "Ciclo completo", boardId: BOARD_ID })

        task.changeStatus("in_progress")
        task.changeStatus("done")

        expect(task.status).toBe("done")
      })

      it("deve avançar updated_at ao mudar de status", () => {
        const task = tarefaEm("todo")
        const antes = task.updatedAt

        task.changeStatus("in_progress")

        expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(antes.getTime())
      })
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
        (de, para) => {
          const task = tarefaEm(de)

          expect(() => task.changeStatus(para)).toThrow(ConflictError)
          expect(task.status).toBe(de)
        }
      )

      it("deve descrever a transição recusada", () => {
        const task = tarefaEm("todo")

        expect(() => task.changeStatus("done"))
          .toThrow("Transição de status inválida: todo -> done")
      })
    })
  })

  describe("updateDetails", () => {
    it("deve atualizar os campos editáveis", () => {
      const task = Task.create({ title: "Título original", boardId: BOARD_ID })

      task.updateDetails({
        title: "Título revisado",
        description: "nova descrição",
        priority: "low",
        assigneeId: ASSIGNEE_ID,
      })

      expect(task.title).toBe("Título revisado")
      expect(task.description).toBe("nova descrição")
      expect(task.priority).toBe("low")
      expect(task.assigneeId).toBe(ASSIGNEE_ID)
    })

    it("não deve alterar o status", () => {
      const task = tarefaEm("in_progress")

      task.updateDetails({ title: "Outro título" })

      expect(task.status).toBe("in_progress")
    })

    it("deve recusar título inválido mantendo o anterior", () => {
      const task = Task.create({ title: "Título original", boardId: BOARD_ID })

      expect(() => task.updateDetails({ title: "AB" })).toThrow()
      expect(task.title).toBe("Título original")
    })
  })

  describe("restore", () => {
    it("deve reconstituir sem revalidar", () => {
      const createdAt = new Date("2026-01-02T00:00:00Z")
      const task = Task.restore({
        id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        title: "Tarefa persistida",
        description: null,
        status: "done",
        priority: "high",
        boardId: BOARD_ID,
        assigneeId: null,
        createdAt,
        updatedAt: createdAt,
      })

      expect(task.status).toBe("done")
      expect(task.createdAt).toBe(createdAt)
    })
  })
})
