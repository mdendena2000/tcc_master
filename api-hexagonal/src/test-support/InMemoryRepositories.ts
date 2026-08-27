/**
 * Fakes das portas, usados pelos testes dos casos de uso.
 *
 * Excluídos do cálculo de cobertura (jest.config.js), por serem código de
 * apoio a testes e não da aplicação.
 */
import { BoardRepository } from "../application/ports/BoardRepository"
import { TaskRepository } from "../application/ports/TaskRepository"
import { UserRepository } from "../application/ports/UserRepository"
import { Board } from "../domain/entities/Board"
import { Task } from "../domain/entities/Task"
import { User } from "../domain/entities/User"
import { TaskStatus } from "../domain/value-objects/TaskStatus"

export class InMemoryUserRepository implements UserRepository {
  public users: User[] = []

  async save(user: User): Promise<void> {
    const i = this.users.findIndex((u) => u.id === user.id)
    if (i >= 0) this.users[i] = user
    else this.users.push(user)
  }
  async findAll(): Promise<User[]> {
    return [...this.users]
  }
  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null
  }
  async delete(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id)
  }
}

export class InMemoryBoardRepository implements BoardRepository {
  public boards: Board[] = []

  async save(board: Board): Promise<void> {
    const i = this.boards.findIndex((b) => b.id === board.id)
    if (i >= 0) this.boards[i] = board
    else this.boards.push(board)
  }
  async findAll(): Promise<Board[]> {
    return [...this.boards]
  }
  async findById(id: string): Promise<Board | null> {
    return this.boards.find((b) => b.id === id) ?? null
  }
  async delete(id: string): Promise<void> {
    this.boards = this.boards.filter((b) => b.id !== id)
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  public tasks: Task[] = []
  public statusesRecebidos: readonly TaskStatus[] = []

  async save(task: Task): Promise<void> {
    const i = this.tasks.findIndex((t) => t.id === task.id)
    if (i >= 0) this.tasks[i] = task
    else this.tasks.push(task)
  }
  async findAll(boardId?: string): Promise<Task[]> {
    return boardId
      ? this.tasks.filter((t) => t.boardId === boardId)
      : [...this.tasks]
  }
  async findById(id: string): Promise<Task | null> {
    return this.tasks.find((t) => t.id === id) ?? null
  }
  async findByTitleInBoard(boardId: string, title: string): Promise<Task | null> {
    return (
      this.tasks.find((t) => t.boardId === boardId && t.title === title) ?? null
    )
  }
  async delete(id: string): Promise<void> {
    this.tasks = this.tasks.filter((t) => t.id !== id)
  }
  async countByBoardAndStatuses(
    boardId: string,
    statuses: readonly TaskStatus[]
  ): Promise<number> {
    this.statusesRecebidos = statuses
    return this.tasks.filter(
      (t) => t.boardId === boardId && statuses.includes(t.status)
    ).length
  }
}
