/**
 * Testes dos casos de uso do recurso Tasks (Hexagonal).
 *
 * As três portas são substituídas por fakes construídos a partir das
 * interfaces. Nenhum jest.mock.
 *
 * A RN02 não é reexercitada aqui: ela pertence à entidade e está coberta em
 * domain/entities/Task.test.ts. Este arquivo verifica apenas a orquestração —
 * que o caso de uso carrega, delega e persiste.
 */
import { Board } from "../../../domain/entities/Board"
import { Task } from "../../../domain/entities/Task"
import { User } from "../../../domain/entities/User"
import {
  InMemoryBoardRepository,
  InMemoryTaskRepository,
  InMemoryUserRepository,
} from "../../../test-support/InMemoryRepositories"
import { ChangeTaskStatus } from "./ChangeTaskStatus"
import { CreateTask } from "./CreateTask"
import { DeleteTask } from "./DeleteTask"
import { GetTaskById } from "./GetTaskById"
import { ListTasks } from "./ListTasks"
import { UpdateTask } from "./UpdateTask"

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000"

describe("Casos de uso de Tasks", () => {
  let tasks: InMemoryTaskRepository
  let boards: InMemoryBoardRepository
  let users: InMemoryUserRepository
  let board: Board
  let assignee: User

  const criar = () => new CreateTask(tasks, boards, users)

  beforeEach(async () => {
    tasks = new InMemoryTaskRepository()
    boards = new InMemoryBoardRepository()
    users = new InMemoryUserRepository()

    assignee = User.create({ name: "João", email: "joao@email.com" })
    await users.save(assignee)

    board = Board.create({ name: "Sprint 1", ownerId: assignee.id })
    await boards.save(board)
  })

  describe("CreateTask", () => {
    it("deve criar e persistir a tarefa", async () => {
      const task = await criar().execute({
        title: "Escrever capítulo 4",
        board_id: board.id,
      })

      expect(task.status).toBe("todo")
      expect(tasks.tasks).toHaveLength(1)
    })

    it("deve recusar quadro inexistente", async () => {
      await expect(
        criar().execute({ title: "Tarefa", board_id: UUID_INEXISTENTE })
      ).rejects.toThrow("Quadro não encontrado")

      expect(tasks.tasks).toHaveLength(0)
    })

    // RN03
    it("deve recusar responsável inexistente", async () => {
      await expect(
        criar().execute({
          title: "Tarefa",
          board_id: board.id,
          assignee_id: UUID_INEXISTENTE,
        })
      ).rejects.toThrow("Usuário responsável não encontrado")

      expect(tasks.tasks).toHaveLength(0)
    })

    it("deve aceitar responsável existente", async () => {
      const task = await criar().execute({
        title: "Com responsável",
        board_id: board.id,
        assignee_id: assignee.id,
      })

      expect(task.assigneeId).toBe(assignee.id)
    })

    // RN05
    it("deve recusar título duplicado no mesmo quadro", async () => {
      await criar().execute({ title: "Tarefa repetida", board_id: board.id })

      await expect(
        criar().execute({ title: "Tarefa repetida", board_id: board.id })
      ).rejects.toThrow("Já existe uma tarefa com este título no quadro")

      expect(tasks.tasks).toHaveLength(1)
    })

    // RN05
    it("deve aceitar o mesmo título em quadros diferentes", async () => {
      const outro = Board.create({ name: "Sprint 2", ownerId: assignee.id })
      await boards.save(outro)

      await criar().execute({ title: "Mesmo título", board_id: board.id })
      await criar().execute({ title: "Mesmo título", board_id: outro.id })

      expect(tasks.tasks).toHaveLength(2)
    })
  })

  describe("ListTasks", () => {
    beforeEach(async () => {
      const outro = Board.create({ name: "Sprint 2", ownerId: assignee.id })
      await boards.save(outro)
      await tasks.save(Task.create({ title: "Tarefa A", boardId: board.id }))
      await tasks.save(Task.create({ title: "Tarefa B", boardId: outro.id }))
    })

    it("deve listar todas sem filtro", async () => {
      await expect(new ListTasks(tasks).execute()).resolves.toHaveLength(2)
    })

    it("deve filtrar por quadro", async () => {
      await expect(new ListTasks(tasks).execute(board.id)).resolves.toHaveLength(1)
    })

    it("deve recusar filtro malformado", async () => {
      await expect(new ListTasks(tasks).execute("abc"))
        .rejects.toThrow("O campo board_id deve ser um UUID válido")
    })
  })

  describe("GetTaskById", () => {
    it("deve retornar a tarefa existente", async () => {
      const criada = await criar().execute({ title: "Tarefa", board_id: board.id })

      await expect(new GetTaskById(tasks).execute(criada.id))
        .resolves.toMatchObject({ id: criada.id })
    })

    it("deve lançar erro quando não existe", async () => {
      await expect(new GetTaskById(tasks).execute(UUID_INEXISTENTE))
        .rejects.toThrow("Tarefa não encontrada")
    })
  })

  describe("UpdateTask", () => {
    it("deve atualizar os campos editáveis", async () => {
      const criada = await criar().execute({ title: "Original", board_id: board.id })

      const task = await new UpdateTask(tasks, users).execute(criada.id, {
        title: "Revisado",
        priority: "high",
      })

      expect(task.title).toBe("Revisado")
      expect(task.priority).toBe("high")
    })

    // RN05
    it("deve permitir manter o próprio título", async () => {
      const criada = await criar().execute({ title: "Original", board_id: board.id })

      await expect(
        new UpdateTask(tasks, users).execute(criada.id, { title: "Original" })
      ).resolves.toBeDefined()
    })

    // RN05
    it("deve recusar título de outra tarefa do quadro", async () => {
      const primeira = await criar().execute({ title: "Primeira", board_id: board.id })
      await criar().execute({ title: "Segunda", board_id: board.id })

      await expect(
        new UpdateTask(tasks, users).execute(primeira.id, { title: "Segunda" })
      ).rejects.toThrow("Já existe uma tarefa com este título no quadro")
    })

    // RN03
    it("deve recusar responsável inexistente", async () => {
      const criada = await criar().execute({ title: "Original", board_id: board.id })

      await expect(
        new UpdateTask(tasks, users).execute(criada.id, {
          title: "Original",
          assignee_id: UUID_INEXISTENTE,
        })
      ).rejects.toThrow("Usuário responsável não encontrado")
    })

    it("deve lançar erro quando a tarefa não existe", async () => {
      await expect(
        new UpdateTask(tasks, users).execute(UUID_INEXISTENTE, { title: "Qualquer" })
      ).rejects.toThrow("Tarefa não encontrada")
    })
  })

  describe("ChangeTaskStatus", () => {
    it("deve persistir o avanço permitido pela entidade", async () => {
      const criada = await criar().execute({ title: "Tarefa", board_id: board.id })

      const task = await new ChangeTaskStatus(tasks).execute(criada.id, "in_progress")

      expect(task.status).toBe("in_progress")
      expect(tasks.tasks[0].status).toBe("in_progress")
    })

    // RN02, decidida pela entidade e apenas propagada pelo caso de uso
    it("deve propagar a recusa da entidade sem persistir", async () => {
      const criada = await criar().execute({ title: "Tarefa", board_id: board.id })

      await expect(new ChangeTaskStatus(tasks).execute(criada.id, "done"))
        .rejects.toThrow("Transição de status inválida: todo -> done")

      expect(tasks.tasks[0].status).toBe("todo")
    })

    it("deve recusar status fora do conjunto", async () => {
      const criada = await criar().execute({ title: "Tarefa", board_id: board.id })

      await expect(new ChangeTaskStatus(tasks).execute(criada.id, "arquivada"))
        .rejects.toThrow("O campo status deve ser um dos valores")
    })

    it("deve lançar erro quando a tarefa não existe", async () => {
      await expect(
        new ChangeTaskStatus(tasks).execute(UUID_INEXISTENTE, "in_progress")
      ).rejects.toThrow("Tarefa não encontrada")
    })
  })

  describe("DeleteTask", () => {
    it("deve remover a tarefa existente", async () => {
      const criada = await criar().execute({ title: "Tarefa", board_id: board.id })

      await new DeleteTask(tasks).execute(criada.id)

      expect(tasks.tasks).toHaveLength(0)
    })

    it("deve lançar erro quando a tarefa não existe", async () => {
      await expect(new DeleteTask(tasks).execute(UUID_INEXISTENTE))
        .rejects.toThrow("Tarefa não encontrada")
    })
  })
})
