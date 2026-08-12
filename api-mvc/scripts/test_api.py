#!/usr/bin/env python3
"""
Teste manual das chamadas HTTP da API.

Exercita os 15 endpoints e as cinco regras de negócio (RN01 a RN05),
verificando o código de status e o corpo de cada resposta.

Não faz parte da suíte medida pelo TCC (Seção 3.7.2): é ferramenta de
inspeção, não indicador de testabilidade.

Uso:
    npm run dev                  # em outro terminal
    python3 scripts/test_api.py
    python3 scripts/test_api.py --url http://localhost:4000

Requer: requests (pip install requests)
"""
import argparse
import sys
import uuid

import requests

VERDE, VERMELHO, AZUL, CINZA, RESET = (
    "\033[32m", "\033[31m", "\033[36m", "\033[90m", "\033[0m"
)

falhas = 0
total = 0
BASE = "http://localhost:3000"


def chamar(metodo, caminho, corpo=None):
    """Executa a requisição e devolve (status, json ou None)."""
    resposta = requests.request(metodo, BASE + caminho, json=corpo, timeout=10)
    try:
        return resposta.status_code, resposta.json()
    except ValueError:
        return resposta.status_code, None


def checar(descricao, metodo, caminho, esperado, corpo=None, campos=None):
    """
    Faz a chamada e compara o status com o esperado.

    campos: dicionário de pares campo/valor que devem estar presentes na
    resposta, para verificar defaults e persistência.
    """
    global falhas, total
    total += 1

    status, dados = chamar(metodo, caminho, corpo)
    erros = []

    if status != esperado:
        erros.append(f"status {status}, esperado {esperado}")

    for campo, valor in (campos or {}).items():
        obtido = (dados or {}).get(campo)
        if obtido != valor:
            erros.append(f"{campo}={obtido!r}, esperado {valor!r}")

    rotulo = f"{metodo:6} {caminho:28} {descricao}"
    if erros:
        falhas += 1
        print(f"{VERMELHO}FALHOU{RESET} {rotulo}")
        for erro in erros:
            print(f"       {VERMELHO}{erro}{RESET}")
        if dados:
            print(f"       {CINZA}{dados}{RESET}")
    else:
        print(f"{VERDE}ok    {RESET} {rotulo}")

    return dados or {}


def secao(titulo):
    print(f"\n{AZUL}== {titulo}{RESET}")


def main():
    global BASE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=BASE, help="URL base da API")
    BASE = parser.parse_args().url.rstrip("/")

    try:
        requests.get(BASE + "/users", timeout=3)
    except requests.RequestException:
        print(f"A API não respondeu em {BASE}. Suba com 'npm run dev'.", file=sys.stderr)
        return 1

    marca = uuid.uuid4().hex[:8]
    inexistente = "00000000-0000-0000-0000-000000000000"

    # ------------------------------------------------------------- USERS
    secao("USERS")

    user = checar(
        "cria usuário", "POST", "/users", 201,
        {"name": "Fulano", "email": f"{marca}@email.com", "admin": True},
        {"name": "Fulano", "admin": True},
    )
    user_id = user["id"]

    checar(
        "admin false por padrão", "POST", "/users", 201,
        {"name": "Sicrano", "email": f"s-{marca}@email.com"},
        {"admin": False},
    )

    checar(  # RN01
        "RN01: e-mail duplicado", "POST", "/users", 409,
        {"name": "Outro", "email": f"{marca}@email.com"},
    )
    checar(
        "nome com menos de 2 caracteres", "POST", "/users", 400,
        {"name": "F", "email": f"n-{marca}@email.com"},
    )
    checar(
        "e-mail em formato inválido", "POST", "/users", 400,
        {"name": "Fulano", "email": "sem-arroba"},
    )
    checar(
        "admin não booleano", "POST", "/users", 400,
        {"name": "Fulano", "email": f"b-{marca}@email.com", "admin": "sim"},
    )

    checar("lista usuários", "GET", "/users", 200)
    checar("busca por id", "GET", f"/users/{user_id}", 200, campos={"id": user_id})
    checar("id inexistente", "GET", f"/users/{inexistente}", 404)
    checar("id malformado", "GET", "/users/abc", 400)

    checar(
        "atualiza usuário", "PUT", f"/users/{user_id}", 200,
        {"name": "Fulano Editado", "email": f"{marca}@email.com", "admin": False},
        {"name": "Fulano Editado", "admin": False},
    )
    checar(
        "omitir admin preserva o perfil", "PUT", f"/users/{user_id}", 200,
        {"name": "Fulano", "email": f"{marca}@email.com"},
        {"admin": False},
    )

    # ------------------------------------------------------------ BOARDS
    secao("BOARDS")

    board = checar(
        "cria quadro", "POST", "/boards", 201,
        {"name": "Quadro de teste", "owner_id": user_id},
        {"name": "Quadro de teste", "owner_id": user_id},
    )
    board_id = board["id"]

    checar(
        "nome com menos de 3 caracteres", "POST", "/boards", 400,
        {"name": "AB", "owner_id": user_id},
    )
    checar(
        "owner_id inexistente", "POST", "/boards", 404,
        {"name": "Quadro X", "owner_id": inexistente},
    )
    checar(
        "owner_id malformado", "POST", "/boards", 400,
        {"name": "Quadro X", "owner_id": "abc"},
    )

    checar("lista quadros", "GET", "/boards", 200)
    checar("busca por id", "GET", f"/boards/{board_id}", 200, campos={"id": board_id})
    checar("id inexistente", "GET", f"/boards/{inexistente}", 404)

    # ------------------------------------------------------------- TASKS
    secao("TASKS")

    task = checar(
        "cria tarefa com defaults", "POST", "/tasks", 201,
        {"title": "Primeira tarefa", "board_id": board_id},
        {"status": "todo", "priority": "medium", "description": None},
    )
    task_id = task["id"]

    checar(  # RN05
        "RN05: título duplicado no quadro", "POST", "/tasks", 409,
        {"title": "Primeira tarefa", "board_id": board_id},
    )
    checar(  # RN03
        "RN03: assignee inexistente", "POST", "/tasks", 404,
        {"title": "Com responsável", "board_id": board_id, "assignee_id": inexistente},
    )
    checar(
        "quadro inexistente", "POST", "/tasks", 404,
        {"title": "Tarefa órfã", "board_id": inexistente},
    )
    checar(
        "prioridade fora do enum", "POST", "/tasks", 400,
        {"title": "Tarefa urgente", "board_id": board_id, "priority": "urgente"},
    )

    checar("lista tarefas", "GET", "/tasks", 200)
    checar("lista filtrando por quadro", "GET", f"/tasks?board_id={board_id}", 200)
    checar("busca por id", "GET", f"/tasks/{task_id}", 200, campos={"id": task_id})

    checar(
        "atualiza tarefa", "PUT", f"/tasks/{task_id}", 200,
        {"title": "Tarefa revisada", "priority": "high", "description": "com texto"},
        {"title": "Tarefa revisada", "priority": "high", "description": "com texto"},
    )

    # ------------------------------------------------- RN02 (transições)
    secao("RN02 - transição de status")

    def transicao(destino, esperado):
        checar(
            f"{destino:12} -> {esperado}", "PATCH", f"/tasks/{task_id}/status",
            esperado, {"status": destino},
            {"status": destino} if esperado == 200 else None,
        )

    transicao("done", 409)          # salto de etapa a partir de todo
    transicao("todo", 409)          # mesmo status
    transicao("in_progress", 200)   # avanço válido
    transicao("todo", 409)          # retrocesso
    transicao("done", 200)          # avanço válido
    transicao("in_progress", 409)   # retrocesso a partir de done
    transicao("done", 409)          # status final
    checar(
        "valor fora do enum", "PATCH", f"/tasks/{task_id}/status", 400,
        {"status": "arquivada"},
    )

    # ------------------------------------------------------ RN04 e limpeza
    secao("RN04 - exclusão de quadro")

    pendente = checar(
        "cria tarefa pendente no quadro", "POST", "/tasks", 201,
        {"title": "Ainda pendente", "board_id": board_id},
        {"status": "todo"},
    )
    checar(
        "RN04: quadro com tarefa pendente", "DELETE", f"/boards/{board_id}", 409,
    )
    checar(
        "remove a tarefa pendente", "DELETE", f"/tasks/{pendente['id']}", 204,
    )
    checar(
        "quadro sem tarefas ativas", "DELETE", f"/boards/{board_id}", 204,
    )
    checar("quadro já removido", "DELETE", f"/boards/{board_id}", 404)

    secao("LIMPEZA")
    checar("remove usuário criado", "DELETE", f"/users/{user_id}", 204)
    for usuario in chamar("GET", "/users")[1] or []:
        if marca in usuario["email"]:
            chamar("DELETE", f"/users/{usuario['id']}")
    print(f"{CINZA}       registros de teste removidos{RESET}")

    # ---------------------------------------------------------- resultado
    print()
    if falhas:
        print(f"{VERMELHO}{falhas} de {total} verificações falharam.{RESET}")
        return 1
    print(f"{VERDE}Todas as {total} verificações passaram.{RESET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())