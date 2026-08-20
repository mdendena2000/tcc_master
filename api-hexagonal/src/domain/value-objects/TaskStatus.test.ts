/**
 * Testes do value object TaskStatus.
 *
 * Fixa quais status o domínio considera ativos — definição da qual a RN04
 * depende e que, no MVC, está embutida na cláusula IN da consulta SQL do
 * BoardRepository.
 */
import {
  ACTIVE_STATUSES,
  requireTaskStatus,
  TASK_STATUSES,
} from "./TaskStatus"

describe("TaskStatus", () => {
  it("deve declarar os três status da Tabela 11", () => {
    expect(TASK_STATUSES).toEqual(["todo", "in_progress", "done"])
  })

  it("deve considerar ativos apenas todo e in_progress", () => {
    expect(ACTIVE_STATUSES).toEqual(["todo", "in_progress"])
    expect(ACTIVE_STATUSES).not.toContain("done")
  })

  it("deve aceitar valores válidos", () => {
    expect(requireTaskStatus("done")).toBe("done")
  })

  it("deve recusar valor fora do conjunto", () => {
    expect(() => requireTaskStatus("arquivada")).toThrow(
      "O campo status deve ser um dos valores: todo, in_progress, done"
    )
  })
})
