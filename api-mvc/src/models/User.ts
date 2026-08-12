/**
 * Entidade User (Tabela 9 do TCC).
 *
 * Estrutura de dados pura: no MVC as regras de negócio ficam no UserModel,
 * e não encapsuladas na própria entidade como ocorre na Arquitetura Hexagonal.
 *
 * O atributo admin não consta na Tabela 9 original; foi acrescentado para
 * permitir a separação de perfis na interface da aplicação (Seção 4.11).
 */
export interface User {
  id: string
  name: string
  email: string
  admin: boolean
  created_at: Date
}