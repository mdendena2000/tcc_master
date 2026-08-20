import express, { Express } from "express"
import cors from "cors"
import { BoardController } from "./controllers/BoardController"
import { TaskController } from "./controllers/TaskController"
import { UserController } from "./controllers/UserController"
import { boardRoutes } from "./routes/boardRoutes"
import { taskRoutes } from "./routes/taskRoutes"
import { userRoutes } from "./routes/userRoutes"

export interface Controllers {
  user: UserController
  board: BoardController
  task: TaskController
}

/**
 * Monta o adaptador HTTP a partir dos controllers já construídos.
 *
 * Não decide quais implementações concretas usar — essa escolha pertence ao
 * composition root.
 */
export function createServer(controllers: Controllers): Express {
  const app = express()

  app.use(express.json())
  app.use(cors())
  app.use(userRoutes(controllers.user))
  app.use(boardRoutes(controllers.board))
  app.use(taskRoutes(controllers.task))

  return app
}
