import { Router } from "express"
import { BoardController } from "../controllers/BoardController"

export function boardRoutes(controller: BoardController): Router {
  const routes = Router()

  routes.post("/boards", (req, res) => controller.create(req, res))
  routes.get("/boards", (req, res) => controller.findAll(req, res))
  routes.get("/boards/:id", (req, res) => controller.findById(req, res))
  routes.delete("/boards/:id", (req, res) => controller.delete(req, res))

  return routes
}
