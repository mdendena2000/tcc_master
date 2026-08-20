import { Router } from "express"
import { UserController } from "../controllers/UserController"

const userRoutes = Router()
const controller = new UserController()

userRoutes.post("/users", (req, res) => controller.create(req, res))
userRoutes.get("/users", (req, res) => controller.findAll(req, res))
userRoutes.get("/users/:id", (req, res) => controller.findById(req, res))
userRoutes.put("/users/:id", (req, res) => controller.update(req, res))
userRoutes.delete("/users/:id", (req, res) => controller.delete(req, res))

export { userRoutes }