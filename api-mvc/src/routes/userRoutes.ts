import { Router } from "express"
import { UserController } from "../controllers/UserController"

/**
 * Mapeamento HTTP -> Controller do recurso Users (Tabela 12 do TCC).
 *
 * Isolar as rotas em um módulo próprio delimita o acoplamento ao framework
 * HTTP, relevante para o Cenário B do experimento de substituição de
 * componentes (Express -> Fastify, Seção 3.7.3).
 */
const userRoutes = Router()
const controller = new UserController()

userRoutes.post("/users", (req, res) => controller.create(req, res))
userRoutes.get("/users", (req, res) => controller.findAll(req, res))
userRoutes.get("/users/:id", (req, res) => controller.findById(req, res))
userRoutes.put("/users/:id", (req, res) => controller.update(req, res))
userRoutes.delete("/users/:id", (req, res) => controller.delete(req, res))

export { userRoutes }