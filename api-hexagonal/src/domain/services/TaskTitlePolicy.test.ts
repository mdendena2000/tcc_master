import { TaskTitlePolicy } from "./TaskTitlePolicy"
import { ConflictError } from "../errors"

const TAREFA_A = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
const TAREFA_B = "0f8fad5b-d9cb-469f-a165-70867728950e"

describe("TaskTitlePolicy (RN05)", () => {
  it("deve permitir quando o título está livre", () => {
    expect(() => TaskTitlePolicy.ensureTitleIsAvailable(null)).not.toThrow()
  })

  it("deve bloquear quando o título pertence a outra tarefa", () => {
    expect(() => TaskTitlePolicy.ensureTitleIsAvailable(TAREFA_A))
      .toThrow(ConflictError)
  })

  it("deve permitir que a tarefa mantenha o próprio título", () => {
    expect(() => TaskTitlePolicy.ensureTitleIsAvailable(TAREFA_A, TAREFA_A))
      .not.toThrow()
  })

  it("deve bloquear ao editar assumindo o título de outra tarefa", () => {
    expect(() => TaskTitlePolicy.ensureTitleIsAvailable(TAREFA_B, TAREFA_A))
      .toThrow("Já existe uma tarefa com este título no quadro")
  })
})
