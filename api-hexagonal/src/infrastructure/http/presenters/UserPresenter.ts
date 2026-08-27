import { User } from "../../../domain/entities/User"

/** Traduz a entidade para o formato de resposta da API. */
export const UserPresenter = {
  toJSON(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      admin: user.admin,
      created_at: user.createdAt,
    }
  },

  toJSONList(users: User[]) {
    return users.map(UserPresenter.toJSON)
  },
}
