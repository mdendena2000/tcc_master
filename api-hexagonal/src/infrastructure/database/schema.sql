-- Esquema do banco (Tabelas 9, 10 e 11 do TCC).
-- As restrições de formato e de tamanho mínimo são validadas nos Models; aqui
-- ficam apenas as garantias estruturais do banco.
--
-- O script é idempotente: cria o esquema em bancos novos e converge bancos já
-- existentes para o estado atual.

-- Users (Tabela 9)

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- admin não consta na Tabela 9 original; usado para separar perfis na
-- interface da aplicação.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin BOOLEAN NOT NULL DEFAULT FALSE;

-- RN01 no nível do banco: e-mail único no sistema. O índice único substitui
-- o índice comum usado anteriormente e também atende às consultas por e-mail.
DROP INDEX IF EXISTS idx_users_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Boards (Tabela 10)

CREATE TABLE IF NOT EXISTS boards (
  id         UUID PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  owner_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards (owner_id);

-- Tasks (Tabela 11)
-- A tabela é criada aqui porque a RN04 depende dela: a exclusão de um quadro
-- consulta as tarefas com status todo ou in_progress. O código do recurso
-- Tasks é implementado na sequência.

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'todo',
  priority    task_priority NOT NULL DEFAULT 'medium',
  board_id    UUID NOT NULL REFERENCES boards (id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks (board_id);

-- RN05 no nível do banco: título único por quadro.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_board_title ON tasks (board_id, title);