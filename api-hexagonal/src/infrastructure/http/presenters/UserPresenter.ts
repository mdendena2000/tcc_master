import { User } from "../../../domain/entities/User"

/**
 * Traduz a entidade para o formato de resposta da API.
 *
 * Mantém o domínio livre do contrato de serialização: a entidade expõe
 * createdAt em camelCase, enquanto a API responde created_at, preservando a
 * paridade de formato com a implementação MVC exigida pela RNF01.
 */
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
