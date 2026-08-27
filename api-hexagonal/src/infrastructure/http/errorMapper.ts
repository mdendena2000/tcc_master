import { Response } from "express"
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors"

/** Traduz erros de domínio em respostas HTTP. */
export function sendError(error: unknown, res: Response) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.message })
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message })
  }
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ message: error.message })
  }
  if (error instanceof ConflictError) {
    return res.status(409).json({ message: error.message })
  }
  return res.status(500).json({ message: "Erro interno do servidor" })
}
