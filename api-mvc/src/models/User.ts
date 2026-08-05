/**
 * Entidade User (Tabela 9 do TCC).
 *
 * Estrutura de dados pura: no MVC as regras de negócio ficam no UserModel,
 * e não encapsuladas na própria entidade como ocorre na Arquitetura Hexagonal.
 */
export interface User {
  id: string
  name: string
  email: string
  created_at: Date
}