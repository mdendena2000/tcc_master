import { Router } from "express"
import { UserController } from "../controllers/UserController"

/**
 * O controller é recebido como parâmetro, e não instanciado aqui: a montagem
 * do grafo de dependências acontece exclusivamente no composition root
 * (main.ts).
 */
export function userRoutes(controller: UserController): Router {
  const routes = Router()

  routes.post("/login", (req, res) => controller.login(req, res))
  routes.post("/users", (req, res) => controller.create(req, res))
  routes.get("/users", (req, res) => controller.findAll(req, res))
  routes.get("/users/:id", (req, res) => controller.findById(req, res))
  routes.put("/users/:id", (req, res) => controller.update(req, res))
  routes.delete("/users/:id", (req, res) => controller.delete(req, res))

  return routes
}
