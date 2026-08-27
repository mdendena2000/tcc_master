import "dotenv/config"
import { CreateBoard } from "./application/use-cases/board/CreateBoard"
import { DeleteBoard } from "./application/use-cases/board/DeleteBoard"
import { GetBoardById } from "./application/use-cases/board/GetBoardById"
import { ListBoards } from "./application/use-cases/board/ListBoards"
import { ChangeTaskStatus } from "./application/use-cases/task/ChangeTaskStatus"
import { CreateTask } from "./application/use-cases/task/CreateTask"
import { DeleteTask } from "./application/use-cases/task/DeleteTask"
import { GetTaskById } from "./application/use-cases/task/GetTaskById"
import { ListTasks } from "./application/use-cases/task/ListTasks"
import { UpdateTask } from "./application/use-cases/task/UpdateTask"
import { AuthenticateUser } from "./application/use-cases/user/AuthenticateUser"
import { CreateUser } from "./application/use-cases/user/CreateUser"
import { DeleteUser } from "./application/use-cases/user/DeleteUser"
import { GetUserById } from "./application/use-cases/user/GetUserById"
import { ListUsers } from "./application/use-cases/user/ListUsers"
import { UpdateUser } from "./application/use-cases/user/UpdateUser"
import { PgBoardRepository } from "./infrastructure/database/PgBoardRepository"
import { PgTaskRepository } from "./infrastructure/database/PgTaskRepository"
import { PgUserRepository } from "./infrastructure/database/PgUserRepository"
import { BoardController } from "./infrastructure/http/controllers/BoardController"
import { TaskController } from "./infrastructure/http/controllers/TaskController"
import { UserController } from "./infrastructure/http/controllers/UserController"
import { createServer } from "./infrastructure/http/server"

/** Composition root. */
const userRepository = new PgUserRepository()
const boardRepository = new PgBoardRepository()
const taskRepository = new PgTaskRepository()

const userController = new UserController(
  new CreateUser(userRepository),
  new ListUsers(userRepository),
  new GetUserById(userRepository),
  new UpdateUser(userRepository),
  new DeleteUser(userRepository),
  new AuthenticateUser(userRepository)
)

const boardController = new BoardController(
  new CreateBoard(boardRepository, userRepository),
  new ListBoards(boardRepository),
  new GetBoardById(boardRepository),
  new DeleteBoard(boardRepository, taskRepository)
)

const taskController = new TaskController(
  new CreateTask(taskRepository, boardRepository, userRepository),
  new ListTasks(taskRepository),
  new GetTaskById(taskRepository),
  new UpdateTask(taskRepository, userRepository),
  new ChangeTaskStatus(taskRepository),
  new DeleteTask(taskRepository)
)

const app = createServer({
  user: userController,
  board: boardController,
  task: taskController,
})
const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`Hexagonal API running on port ${PORT}`)
})
