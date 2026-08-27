import { Board } from "../../../domain/entities/Board"

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
