-- Esquema do recurso Users (Tabela 9 do TCC).
-- As restrições de formato e de tamanho mínimo são validadas no Model; aqui
-- ficam apenas as garantias estruturais do banco.
--
-- O script é idempotente: cria a tabela em bancos novos e converge bancos já
-- existentes para o esquema atual.

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- RN01 no nível do banco: e-mail único no sistema. O índice único substitui
-- o índice comum usado anteriormente e também atende às consultas por e-mail.
DROP INDEX IF EXISTS idx_users_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);