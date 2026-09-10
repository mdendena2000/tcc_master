# MVC × Hexagonal — aplicação experimental

Duas implementações da mesma API REST, usadas no experimento comparativo do
TCC. Compartilham Node.js, Express e PostgreSQL; diferem apenas na organização
interna do código.

| | `api-mvc/` | `api-hexagonal/` |
|---|---|---|
| Camadas | `controllers` · `models` · `repositories` · `routes` | `domain` · `application` · `infrastructure` |
| Acesso a dados | classe concreta, instanciada pelo Model | interface (porta), injetada no caso de uso |
| Transição de status (RN02) | `TaskController` | entidade `Task.changeStatus()` |
| Porta padrão | 3000 | 3001 |

As duas expõem os mesmos 16 endpoints, com os mesmos códigos de status.

---

## Pré-requisitos

- Node.js 16.14+ (ver *Limitações* no fim)
- PostgreSQL em execução
- `psql` e `python3` para os scripts auxiliares

## Preparando o ambiente

Cada projeto tem o próprio `.env`. Crie a partir do modelo:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=architecture_compare
DB_PASSWORD=sua-senha
DB_PORT=5432
PORT=3000          # use 3001 em api-hexagonal
```

Depois, em cada projeto:

```bash
npm install
npm run migrate    # cria/atualiza as tabelas (idempotente)
npm run dev        # sobe a API
```

O esquema é idêntico nos dois e ambos apontam para o mesmo banco. Rode
`migrate` em qualquer um dos dois; rodar nos dois não causa problema.

---

## 1. Testes unitários

Rodam **sem banco e sem servidor** — os repositórios são substituídos por
dublês. Levam poucos segundos.

```bash
cd api-mvc          # ou api-hexagonal
npm test
```

| Comando | O que faz |
|---|---|
| `npm test` | roda a suíte inteira |
| `npm run test:coverage` | cobertura por arquivo, considerando todo o `src/` |
| `npx jest --watch` | re-executa ao salvar |
| `npx jest UserModel` | só os arquivos cujo caminho casa com o texto |
| `npx jest -t "RN02"` | só os testes cujo nome casa |
| `npx jest --verbose` | lista cada teste individualmente |

Contagem atual: **68** no MVC e **122** no Hexagonal.

A diferença de estratégia entre os dois é proposital e é um dado do
experimento: o MVC precisa de `jest.mock` para interceptar o módulo do
repositório, enquanto o Hexagonal substitui a porta por um fake em
`src/test-support/`.

---

## 2. Análise de acoplamento (dependency-cruiser)

Verifica as regras arquiteturais e calcula Ca, Ce e Instability.

```bash
cd api-mvc          # ou api-hexagonal
npm run arch            # valida as regras — exit 0 se estiver tudo certo
npm run arch:metrics    # tabela Ca / Ce / I por módulo e pasta
npm run arch:graph      # gera arch.mmd (diagrama Mermaid)
```

Relatório consolidado dos dois projetos, com métricas por camada, ciclos,
órfãos e análise do gradiente de estabilidade:

```bash
python3 arch_report.py     # a partir da raiz
```

### Regras configuradas

Ficam em `.dependency-cruiser.js` dentro de cada projeto. Testes e
`test-support/` são excluídos do grafo nos dois, para a comparação ser justa.

**`api-hexagonal`** — protege o isolamento do núcleo:

| Regra | Proíbe |
|---|---|
| `dominio-sem-infra` | `domain` → `infrastructure` |
| `dominio-sem-aplicacao` | `domain` → `application` |
| `casos-de-uso-sem-infra` | `application` → `infrastructure` |
| `nucleo-sem-express` | `domain`/`application` → `express`, `cors` |
| `nucleo-sem-driver-de-banco` | `domain`/`application` → `pg` |
| `sem-ciclos` | dependências circulares |
| `sem-orfaos` | módulos que ninguém importa (severidade `warn`) |

**`api-mvc`** — protege o sentido do fluxo:

| Regra | Proíbe |
|---|---|
| `modelo-sem-controller` | `models` → `controllers`, `routes` |
| `repositorio-sem-controller` | `repositories` → camadas acima |
| `controller-sem-banco` | `controllers` → `database`, `repositories` |
| `modelo-sem-framework-http` | `models`/`repositories` → `express`, `cors` |
| `sem-ciclos` | dependências circulares |
| `sem-orfaos` | módulos que ninguém importa (severidade `warn`) |

---

## 3. Verificando que as regras funcionam

Uma regra que nunca falha não prova nada. Para confirmar que a configuração é
efetiva, injete uma violação, rode a validação e desfaça.

O procedimento é sempre o mesmo:

```bash
# 1. injeta o import proibido na primeira linha do arquivo
sed -i '1i <LINHA>' <ARQUIVO>

# 2. valida — deve acusar a regra e sair com código diferente de zero
npx depcruise src --output-type err

# 3. desfaz
git checkout -- <ARQUIVO>
```

### api-hexagonal

| Regra esperada | Arquivo | Linha a inserir |
|---|---|---|
| `dominio-sem-infra` | `src/domain/entities/User.ts` | `import { pool } from "../../infrastructure/database/pg"` |
| `dominio-sem-aplicacao` | `src/domain/services/BoardDeletionPolicy.ts` | `import { CreateUser } from "../../application/use-cases/user/CreateUser"` |
| `casos-de-uso-sem-infra` | `src/application/use-cases/user/CreateUser.ts` | `import { PgUserRepository } from "../../../infrastructure/database/PgUserRepository"` |
| `nucleo-sem-express` | `src/domain/entities/User.ts` | `import express from "express"` |
| `nucleo-sem-driver-de-banco` | `src/application/use-cases/user/CreateUser.ts` | `import { Pool } from "pg"` |

### api-mvc

| Regra esperada | Arquivo | Linha a inserir |
|---|---|---|
| `modelo-sem-controller` | `src/models/UserModel.ts` | `import { UserController } from "../controllers/UserController"` |
| `controller-sem-banco` | `src/controllers/UserController.ts` | `import { UserRepository } from "../repositories/UserRepository"` |
| `repositorio-sem-controller` | `src/repositories/UserRepository.ts` | `import { UserModel } from "../models/UserModel"` |
| `modelo-sem-framework-http` | `src/models/UserModel.ts` | `import express from "express"` |

### Módulo órfão (os dois projetos)

Crie um arquivo que ninguém importa e rode a validação:

```bash
echo 'export const x = 1' > src/models/Esquecido.ts   # hexagonal: src/domain/Esquecido.ts
npx depcruise src --output-type err                    # warn sem-orfaos
rm src/models/Esquecido.ts
```

### Sobre a saída

- **Duas regras podem disparar ao mesmo tempo.** Fazer o Model importar o
  Controller viola `modelo-sem-controller` *e* cria um ciclo, porque o
  Controller já importa o Model.
- **O exit code é a quantidade de violações**, não apenas 0 ou 1.
- **Órfão não derruba o comando** (`exit 0`), por ser `warn`. Para que barre,
  troque `severity` para `error` em `.dependency-cruiser.js`.

---

## 4. Testes de API (contra o banco real)

Exercita os 16 endpoints e as cinco regras de negócio por HTTP. Precisa da API
no ar e do PostgreSQL acessível.

```bash
cd api-mvc && npm run dev          # terminal 1
python3 test_api.py                # terminal 2 — usa localhost:3000
python3 test_api.py --url http://localhost:3001
```

São 47 verificações. O script cria os registros de que precisa e os remove ao
final. Requer o pacote `requests` (`pip install requests`).

Para comparar as duas implementações lado a lado, suba ambas em portas
distintas:

```bash
cd api-mvc        && PORT=3000 npm run dev
cd api-hexagonal  && PORT=3001 npm run dev
```

---

## Regras de negócio

| | Regra | Onde vive no MVC | Onde vive no Hexagonal |
|---|---|---|---|
| RN01 | E-mail único | `UserModel` | `CreateUser` / `UpdateUser` |
| RN02 | Status só avança `todo → in_progress → done` | `TaskController` | `Task.changeStatus()` |
| RN03 | Responsável precisa existir | `TaskModel` | `CreateTask` / `UpdateTask` |
| RN04 | Quadro com tarefa ativa não é excluído | `BoardModel` | `BoardDeletionPolicy` |
| RN05 | Título único por quadro | `TaskModel` | `TaskTitlePolicy` |

---

## Limitações conhecidas

- **Node.js 16** está em fim de vida. O `dependency-cruiser` está fixado na
  versão `13.1.5`, a última compatível. Se atualizar o Node, faça antes de
  coletar qualquer medição — trocar o runtime depois invalida os resultados.
- **Graphviz não é usado**: `arch:graph` gera Mermaid, que não exige binário
  externo.
- **Não há autenticação nos endpoints.** `POST /login` valida credenciais e
  devolve o usuário, mas nenhuma rota exige sessão ou token.
