import { Router } from "express"
import { TaskController } from "../controllers/TaskController"

export function taskRoutes(controller: TaskController): Router {
  const routes = Router()

  routes.post("/tasks", (req, res) => controller.create(req, res))
  routes.get("/tasks", (req, res) => controller.findAll(req, res))
  routes.get("/tasks/:id", (req, res) => controller.findById(req, res))
  routes.patch("/tasks/:id/status", (req, res) => controller.updateStatus(req, res))
  routes.put("/tasks/:id", (req, res) => controller.update(req, res))
  routes.delete("/tasks/:id", (req, res) => controller.delete(req, res))

  return routes
}
