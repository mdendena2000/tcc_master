# MVC × Hexagonal

Duas implementações da mesma API REST (Node.js, Express, PostgreSQL), usadas
no experimento comparativo do TCC.

| | Porta |
|---|---|
| `api-mvc/` | 3000 |
| `api-hexagonal/` | 3001 |

---

## Preparando

Crie o `.env` em cada projeto:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=architecture_compare
DB_PASSWORD=sua-senha
DB_PORT=5432
PORT=3000          # 3001 em api-hexagonal
```

Depois, em cada um:

```bash
npm install
npm run migrate    # cria as tabelas (idempotente)
npm run dev        # sobe a API
```

Os dois projetos usam o mesmo banco, então basta rodar `migrate` uma vez.

---

## Testes unitários

Rodam sem banco e sem servidor.

```bash
cd api-mvc          # ou api-hexagonal
npm test
npm run test:coverage       # cobertura por arquivo
```

---

## Acoplamento (dependency-cruiser)

```bash
cd api-mvc          # ou api-hexagonal
npm run arch                # valida as regras — exit 0 se estiver tudo certo
npm run arch:metrics        # Ca / Ce / Instability por módulo
```

As regras ficam em `.dependency-cruiser.js` dentro de cada projeto. Para
conferir que funcionam, insira um import proibido, rode `npm run arch` e
desfaça com `git checkout`:

```bash
sed -i '1i import { pool } from "../../infrastructure/database/pg"' \
  api-hexagonal/src/domain/entities/User.ts
```

---

## Testes de API

Exercita os 16 endpoints e as cinco regras de negócio por HTTP. Precisa da API
no ar.

```bash
python3 test_api.py                              # localhost:3000
python3 test_api.py --url http://localhost:3001
```

Requer `requests` (`pip install requests`).

---

## Testes de carga

```bash
cd performance-test
npm install

npm run bench:light     # 10 conexões
npm run bench:medium    # 50 conexões
```

Mede o `api-mvc` por padrão. Para o `api-hexagonal`:

```bash
node run.js --url http://localhost:3001
API_URL=http://localhost:3001 npm run bench:medium
```

| Flag | Padrão | |
|---|---|---|
| `--url` | `http://localhost:3000` | API a medir |
| `--connections` | 10 | conexões simultâneas |
| `--duration` | 10 | segundos por cenário |
| `--seed` | 100 | base nos cenários de leitura |
| `--scenario` | `all` | `get-users`, `post-users`, `mixed` |

Cada cenário prepara o banco antes de rodar: leitura e misto partem de `--seed`
usuários, escrita parte da tabela vazia.

**Meça uma API por vez** — as duas juntas disputariam CPU e banco. E use o
mesmo `--seed` nas duas, senão os números não são comparáveis.
