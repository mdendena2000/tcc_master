import { Board } from "../../domain/entities/Board"

/**
 * Porta secundária (outbound) de persistência de quadros.
 */
export interface BoardRepository {
  save(board: Board): Promise<void>
  findAll(): Promise<Board[]>
  findById(id: string): Promise<Board | null>
  delete(id: string): Promise<void>
}
