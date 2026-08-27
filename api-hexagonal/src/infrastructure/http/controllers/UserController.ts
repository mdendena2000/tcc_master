import { Request, Response } from "express"
import { AuthenticateUser } from "../../../application/use-cases/user/AuthenticateUser"
import { CreateUser } from "../../../application/use-cases/user/CreateUser"
import { DeleteUser } from "../../../application/use-cases/user/DeleteUser"
import { GetUserById } from "../../../application/use-cases/user/GetUserById"
import { ListUsers } from "../../../application/use-cases/user/ListUsers"
import { UpdateUser } from "../../../application/use-cases/user/UpdateUser"
import { sendError } from "../errorMapper"
import { UserPresenter } from "../presenters/UserPresenter"

/**
 * Adaptador primário (inbound) do recurso Users (Tabela 12 do TCC).
 *
 * Sua responsabilidade se limita a traduzir HTTP para chamadas de casos de
 * uso e o resultado de volta para HTTP. Nenhuma regra de negócio reside aqui
 * — contraste direto com o TaskController do MVC, que hospeda a RN02.
 */
export class UserController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly listUsers: ListUsers,
    private readonly getUserById: GetUserById,
    private readonly updateUser: UpdateUser,
    private readonly deleteUser: DeleteUser,
    private readonly authenticateUser: AuthenticateUser
  ) {}

  async create(req: Request, res: Response) {
    try {
      const user = await this.createUser.execute(req.body)
      return res.status(201).json(UserPresenter.toJSON(user))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findAll(_req: Request, res: Response) {
    try {
      const users = await this.listUsers.execute()
      return res.status(200).json(UserPresenter.toJSONList(users))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const user = await this.getUserById.execute(req.params.id)
      return res.status(200).json(UserPresenter.toJSON(user))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = await this.updateUser.execute(req.params.id, req.body)
      return res.status(200).json(UserPresenter.toJSON(user))
    } catch (error) {
      return sendError(error, res)
    }
  }

  /** POST /login — valida as credenciais e devolve o usuário autenticado. */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const user = await this.authenticateUser.execute(email, password)
      return res.status(200).json(UserPresenter.toJSON(user))
    } catch (error) {
      return sendError(error, res)
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.deleteUser.execute(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return sendError(error, res)
    }
  }
}
