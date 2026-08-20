import { Board } from "../../../domain/entities/Board"

/**
 * Traduz a entidade Board para o formato de resposta da API, preservando a
 * paridade com a implementação MVC (RNF01).
 */
export const BoardPresenter = {
  toJSON(board: Board) {
    return {
      id: board.id,
      name: board.name,
      owner_id: board.ownerId,
      created_at: board.createdAt,
    }
  },

  toJSONList(boards: Board[]) {
    return boards.map(BoardPresenter.toJSON)
  },
}
