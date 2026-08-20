import { randomUUID } from "crypto"
import { requireText, requireUuid } from "../validation"

const NAME_MIN_LENGTH = 3

interface BoardProps {
  id: string
  name: string
  ownerId: string
  createdAt: Date
}

/**
 * Entidade Board (Tabela 10 do TCC).
 *
 * As invariantes de formato são impostas na própria construção. A existência
 * do proprietário depende de consultar outro agregado e por isso é
 * responsabilidade dos casos de uso, não da entidade.
 */
export class Board {
  private constructor(
    public readonly id: string,
    private _name: string,
    public readonly ownerId: string,
    public readonly createdAt: Date
  ) {}

  static create(input: { name: unknown; ownerId: unknown }): Board {
    return new Board(
      randomUUID(),
      requireText(input.name, "name", NAME_MIN_LENGTH),
      requireUuid(input.ownerId, "owner_id"),
      new Date()
    )
  }

  static restore(props: BoardProps): Board {
    return new Board(props.id, props.name, props.ownerId, props.createdAt)
  }

  get name(): string {
    return this._name
  }

  rename(name: unknown): void {
    this._name = requireText(name, "name", NAME_MIN_LENGTH)
  }
}
