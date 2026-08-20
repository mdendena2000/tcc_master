import {
  DEFAULT_PRIORITY,
  priorityOrDefault,
  requirePriority,
  TASK_PRIORITIES,
} from "./Priority"

describe("Priority", () => {
  it("deve declarar as três prioridades da Tabela 11", () => {
    expect(TASK_PRIORITIES).toEqual(["low", "medium", "high"])
  })

  it("deve adotar medium como padrão", () => {
    expect(DEFAULT_PRIORITY).toBe("medium")
    expect(priorityOrDefault(undefined)).toBe("medium")
    expect(priorityOrDefault(null)).toBe("medium")
    expect(priorityOrDefault("")).toBe("medium")
  })

  it("deve aceitar valores válidos", () => {
    expect(priorityOrDefault("high")).toBe("high")
    expect(requirePriority("low")).toBe("low")
  })

  it("deve recusar valor fora do conjunto", () => {
    expect(() => requirePriority("urgente"))
      .toThrow("O campo priority deve ser um dos valores: low, medium, high")
  })
})
