import { Router } from "express"
import { TaskController } from "../controllers/TaskController"

const taskRoutes = Router()
const controller = new TaskController()

taskRoutes.post("/tasks", (req, res) => controller.create(req, res))
taskRoutes.get("/tasks", (req, res) => controller.findAll(req, res))
taskRoutes.get("/tasks/:id", (req, res) => controller.findById(req, res))
taskRoutes.patch("/tasks/:id/status", (req, res) => controller.updateStatus(req, res))
taskRoutes.put("/tasks/:id", (req, res) => controller.update(req, res))
taskRoutes.delete("/tasks/:id", (req, res) => controller.delete(req, res))

export { taskRoutes }