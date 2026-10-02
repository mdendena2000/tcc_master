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
```

As duas APIs precisam estar no ar — a 3000 e a 3001 —, mas só uma recebe carga
por vez: medir as duas em paralelo faria uma disputar CPU e banco com a outra.

```bash
node experimento.js
node experimento.js --repeticoes 5 --duracao 20
```

| Flag | Padrão | |
|---|---|---|
| `--repeticoes` | 3 | repetições de cada cenário em cada API |
| `--conexoes` | 50 | conexões simultâneas |
| `--duracao` | 20 | segundos por medição |
| `--seed` | 100 | base nos cenários de leitura |
| `--aquecimento` | 8 | segundos descartados antes de coletar |
| `--ordem` | `pareada` | encadeamento das medições |
| `--mvc` | `http://localhost:3000` | URL da API MVC |
| `--hexagonal` | `http://localhost:3001` | URL da API Hexagonal |

São três cenários, e cada um prepara o banco antes de rodar: `GET /users` e o
misto partem de `--seed` usuários, `POST /users` parte da tabela vazia.

### Ordem das medições

Medir uma API inteira e depois a outra favorece sistematicamente a segunda:
cache do SO, buffers do PostgreSQL e JIT do V8 chegam aquecidos. Nesse
ambiente o efeito chegou a 51% — dez vezes maior que a diferença entre as
arquiteturas. Por isso o `--ordem`:

| Valor | |
|---|---|
| `pareada` | cada cenário mede as duas APIs em sequência, invertendo quem abre o par |
| `mvc` | ordem fixa, MVC primeiro |
| `hexagonal` | ordem fixa, Hexagonal primeiro |

A `pareada` é o padrão porque aproxima no tempo as duas medições que serão
comparadas: uma oscilação da máquina atinge as duas de forma parecida em vez
de entrar só numa delas. As ordens fixas servem para medir o próprio viés de
ordem, não para concluir.

### Relatórios

O JSON é reescrito a cada medição, com `parcial: true` enquanto a coleta não
termina — interromper no meio preserva o que já foi coletado. Para reimprimir
o relatório de um arquivo salvo:

```bash
node relatorio.js resultados/<arquivo>.json
node relatorio.js resultados/<arquivo>.json --bruto   # valores por repetição
```
