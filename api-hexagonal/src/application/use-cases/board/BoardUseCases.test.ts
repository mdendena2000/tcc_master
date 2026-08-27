/**
 * Testes dos casos de uso do recurso Boards (Hexagonal).
 *
 * As duas portas envolvidas são substituídas por fakes construídos a partir
 * das interfaces. Nenhum jest.mock: o teste não sabe que existe PostgreSQL do
 * outro lado e continuaria válido após o Cenário A da Seção 3.7.3.
 */
import { Task } from "../../../domain/entities/Task"
import { User } from "../../../domain/entities/User"
import {
  InMemoryBoardRepository,
  InMemoryTaskRepository,
  InMemoryUserRepository,
} from "../../../test-support/InMemoryRepositories"
import { CreateBoard } from "./CreateBoard"
import { DeleteBoard } from "./DeleteBoard"
import { GetBoardById } from "./GetBoardById"
import { ListBoards } from "./ListBoards"

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000"

/** Porta de tarefas vazia. */
function taskRepo(): InMemoryTaskRepository {
  return new InMemoryTaskRepository()
}

/** Porta de tarefas contendo n tarefas ativas (status todo) no quadro. */
function taskRepoComAtivas(quantidade: number, boardId: string) {
  const repo = new InMemoryTaskRepository()
  for (let i = 0; i < quantidade; i++) {
    repo.tasks.push(Task.create({ title: `Tarefa ${i + 1}`, boardId }))
  }
  return repo
}

describe("Casos de uso de Boards", () => {
  let boards: InMemoryBoardRepository
  let users: InMemoryUserRepository
  let owner: User

  beforeEach(async () => {
    boards = new InMemoryBoardRepository()
    users = new InMemoryUserRepository()
    owner = User.create({ name: "João", email: "joao@email.com", password: "senha123" })
    await users.save(owner)
  })

  describe("CreateBoard", () => {
    it("deve criar quando o proprietário existe", async () => {
      const board = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })

      expect(board.name).toBe("Sprint 1")
      expect(boards.boards).toHaveLength(1)
    })

    it("deve recusar proprietário inexistente", async () => {
      await expect(
        new CreateBoard(boards, users).execute({
          name: "Sprint 1",
          owner_id: UUID_INEXISTENTE,
        })
      ).rejects.toThrow("Usuário não encontrado")

      expect(boards.boards).toHaveLength(0)
    })

    it("deve propagar erro de validação da entidade", async () => {
      await expect(
        new CreateBoard(boards, users).execute({ name: "AB", owner_id: owner.id })
      ).rejects.toThrow()
    })
  })

  describe("ListBoards / GetBoardById", () => {
    it("deve listar os quadros", async () => {
      await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })

      await expect(new ListBoards(boards).execute()).resolves.toHaveLength(1)
    })

    it("deve buscar por id", async () => {
      const criado = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })

      await expect(new GetBoardById(boards).execute(criado.id))
        .resolves.toMatchObject({ id: criado.id })
    })

    it("deve lançar erro quando não existe", async () => {
      await expect(new GetBoardById(boards).execute(UUID_INEXISTENTE))
        .rejects.toThrow("Quadro não encontrado")
    })

    it("deve recusar id malformado", async () => {
      await expect(new GetBoardById(boards).execute("abc"))
        .rejects.toThrow("O campo id deve ser um UUID válido")
    })
  })

  describe("DeleteBoard", () => {
    it("deve excluir quando não há tarefas ativas", async () => {
      const criado = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })

      await new DeleteBoard(boards, taskRepo()).execute(criado.id)

      expect(boards.boards).toHaveLength(0)
    })

    // RN04
    it("deve bloquear quando há tarefas ativas", async () => {
      const criado = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })

      await expect(
        new DeleteBoard(boards, taskRepoComAtivas(2, criado.id)).execute(criado.id)
      ).rejects.toThrow("O quadro possui tarefas pendentes ou em andamento")

      expect(boards.boards).toHaveLength(1)
    })

    it("deve permitir excluir quando todas as tarefas estão concluídas", async () => {
      const criado = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })
      const tasks = taskRepoComAtivas(2, criado.id)
      tasks.tasks.forEach((t) => {
        t.changeStatus("in_progress")
        t.changeStatus("done")
      })

      await new DeleteBoard(boards, tasks).execute(criado.id)

      expect(boards.boards).toHaveLength(0)
    })

    it("deve consultar exatamente os status ativos definidos pelo domínio", async () => {
      const criado = await new CreateBoard(boards, users).execute({
        name: "Sprint 1",
        owner_id: owner.id,
      })
      const tasks = taskRepo()

      await new DeleteBoard(boards, tasks).execute(criado.id)

      expect(tasks.statusesRecebidos).toEqual(["todo", "in_progress"])
    })

    it("deve lançar erro quando o quadro não existe", async () => {
      await expect(
        new DeleteBoard(boards, taskRepo()).execute(UUID_INEXISTENTE)
      ).rejects.toThrow("Quadro não encontrado")
    })
  })
})
