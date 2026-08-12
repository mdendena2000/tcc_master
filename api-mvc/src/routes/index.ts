import { Router } from "express"
import { userRoutes } from "./userRoutes"
import { boardRoutes } from "./boardRoutes"
import { taskRoutes } from "./taskRoutes"

const routes = Router()

routes.use(userRoutes)
routes.use(boardRoutes)
routes.use(taskRoutes)

export { routes }