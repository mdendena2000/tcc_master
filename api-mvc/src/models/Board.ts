/**
 * Entidade Board (Tabela 10 do TCC).
 *
 * Cada quadro pertence a um usuário, identificado por owner_id.
 */
export interface Board {
  id: string
  name: string
  owner_id: string
  created_at: Date
}
