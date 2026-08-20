/**
 * Testes da RN04 (Hexagonal).
 *
 * A regra é um serviço de domínio puro: recebe um número e decide. Não há
 * repositório, dublê, mock ou fake — a chamada é direta.
 *
 * No MVC a mesma regra está dentro de BoardModel.delete(), entre duas
 * chamadas ao repositório concreto, e só pode ser exercitada interceptando o
 * módulo com jest.mock (Seção 3.7.2c).
 */
import { BoardDeletionPolicy } from "./BoardDeletionPolicy"
import { ConflictError } from "../errors"

describe("BoardDeletionPolicy (RN04)", () => {
  it("deve permitir excluir quando não há tarefas ativas", () => {
    expect(() => BoardDeletionPolicy.ensureCanDelete(0)).not.toThrow()
  })

  it.each([1, 2, 57])(
    "deve bloquear a exclusão com %i tarefa(s) ativa(s)",
    (quantidade) => {
      expect(() => BoardDeletionPolicy.ensureCanDelete(quantidade))
        .toThrow(ConflictError)
    }
  )

  it("deve descrever o motivo do bloqueio", () => {
    expect(() => BoardDeletionPolicy.ensureCanDelete(1)).toThrow(
      "O quadro possui tarefas pendentes ou em andamento e não pode ser excluído"
    )
  })
})
