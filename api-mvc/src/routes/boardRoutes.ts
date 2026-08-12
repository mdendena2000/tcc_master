import { Router } from "express"
import { BoardController } from "../controllers/BoardController"

/**
 * Mapeamento HTTP -> Controller do recurso Boards (Tabela 13 do TCC).
 */
const boardRoutes = Router()
const controller = new BoardController()

boardRoutes.post("/boards", (req, res) => controller.create(req, res))
boardRoutes.get("/boards", (req, res) => controller.findAll(req, res))
boardRoutes.get("/boards/:id", (req, res) => controller.findById(req, res))
boardRoutes.delete("/boards/:id", (req, res) => controller.delete(req, res))

export { boardRoutes }