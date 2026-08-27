#!/usr/bin/env python3
"""
Relatório de acoplamento das duas APIs.

Roda o dependency-cruiser em cada projeto e consolida, por camada:
  Ca  acoplamento aferente  - quantos módulos dependem da camada
  Ce  acoplamento eferente  - de quantos módulos a camada depende
  I   instabilidade          - Ce / (Ca + Ce)

Também reporta ciclos de dependência, módulos órfãos e violações de regra.

Uso: python3 arch_report.py
"""
import json
import subprocess
import sys

# Camada onde residem as regras de negócio em cada arquitetura. Segundo
# Martin (2017), é ela que deveria ser a mais estável do sistema.
CAMADA_DE_NEGOCIO = {"api-mvc": "models", "api-hexagonal": "domain"}

PROJETOS = {
    "api-mvc": {
        "controllers": "src/controllers",
        "models": "src/models",
        "repositories": "src/repositories",
        "routes": "src/routes",
        "database": "src/database",
    },
    "api-hexagonal": {
        "domain": "src/domain",
        "application": "src/application",
        "infrastructure": "src/infrastructure",
    },
}

VERDE, VERMELHO, AZUL, CINZA, RESET = (
    "\033[32m", "\033[31m", "\033[36m", "\033[90m", "\033[0m"
)


def cruzar(projeto):
    saida = subprocess.run(
        ["npx", "depcruise", "src", "--output-type", "json"],
        cwd=projeto, capture_output=True, text=True,
    )
    if not saida.stdout:
        print(saida.stderr, file=sys.stderr)
        sys.exit(f"falha ao analisar {projeto}")
    return json.loads(saida.stdout)


def camada_de(caminho, camadas):
    for nome, prefixo in camadas.items():
        if caminho.startswith(prefixo + "/"):
            return nome
    return None


def metricas(dados, camadas):
    """Ca e Ce por camada, contando apenas dependências que a atravessam."""
    resultado = {n: {"n": 0, "ca": set(), "ce": set()} for n in camadas}

    for modulo in dados["modules"]:
        origem = camada_de(modulo["source"], camadas)
        if origem is None:
            continue
        resultado[origem]["n"] += 1

        for dep in modulo["dependencies"]:
            destino = camada_de(dep["resolved"], camadas)
            if destino and destino != origem:
                resultado[origem]["ce"].add(dep["resolved"])
                resultado[destino]["ca"].add(modulo["source"])

    linhas = []
    for nome in camadas:
        ca, ce = len(resultado[nome]["ca"]), len(resultado[nome]["ce"])
        i = ce / (ca + ce) if (ca + ce) else 0.0
        linhas.append((nome, resultado[nome]["n"], ca, ce, i))
    return linhas


def indicadores(dados):
    violacoes = dados["summary"]["violations"]
    ciclos = [v for v in violacoes if v["rule"]["name"] == "sem-ciclos"]
    orfaos = [m["source"] for m in dados["modules"] if m.get("orphan")]
    erros = [v for v in violacoes if v["rule"]["severity"] == "error"]
    return len(ciclos), orfaos, len(erros), dados["summary"]["totalCruised"]


def main():
    print(f"\n{AZUL}ANÁLISE DE ACOPLAMENTO{RESET}\n")
    consolidado = {}

    for projeto, camadas in PROJETOS.items():
        dados = cruzar(projeto)
        ciclos, orfaos, erros, modulos = indicadores(dados)
        linhas = metricas(dados, camadas)
        consolidado[projeto] = linhas

        print(f"{AZUL}{projeto}{RESET}  ({modulos} módulos)")
        print(f"  {'camada':<16}{'N':>4}{'Ca':>6}{'Ce':>6}{'I':>8}")
        print(f"  {'-'*16}{'-'*4}{'-'*6}{'-'*6}{'-'*8}")
        for nome, n, ca, ce, i in linhas:
            print(f"  {nome:<16}{n:>4}{ca:>6}{ce:>6}{i:>7.2f}")

        cor_c = VERDE if ciclos == 0 else VERMELHO
        cor_o = VERDE if not orfaos else VERMELHO
        cor_e = VERDE if erros == 0 else VERMELHO
        print(f"\n  ciclos: {cor_c}{ciclos}{RESET}   "
              f"órfãos: {cor_o}{len(orfaos)}{RESET}   "
              f"violações: {cor_e}{erros}{RESET}")
        for o in orfaos:
            print(f"    {CINZA}órfão: {o}{RESET}")
        print()

    # gradiente de estabilidade: alto nível estável, baixo nível instável
    print(f"{AZUL}GRADIENTE DE ESTABILIDADE{RESET}\n")
    for projeto, linhas in consolidado.items():
        ordenado = sorted(linhas, key=lambda l: l[4])
        trilha = "  <  ".join(f"{n} ({i:.2f})" for n, _, _, _, i in ordenado)
        print(f"  {projeto:<16} {trilha}")

    # Martin (2017): a camada de regras de negócio deve ser a mais estável.
    # Se alguma camada de infraestrutura for mais estável que ela, o gradiente
    # está invertido — sinal de violação do princípio da inversão de dependência.
    print(f"\n{AZUL}POSIÇÃO DA CAMADA DE NEGÓCIO{RESET}\n")
    for projeto, linhas in consolidado.items():
        alvo = CAMADA_DE_NEGOCIO[projeto]
        ordenado = sorted(linhas, key=lambda l: l[4])
        posicao = [n for n, _, _, _, _ in ordenado].index(alvo) + 1
        i_alvo = dict((n, i) for n, _, _, _, i in linhas)[alvo]
        acima = [f"{n} ({i:.2f})" for n, _, _, _, i in ordenado if i < i_alvo]

        if acima:
            print(f"  {VERMELHO}{projeto}{RESET}: {alvo} (I={i_alvo:.2f}) é a "
                  f"{posicao}ª mais estável de {len(linhas)}")
            print(f"    gradiente invertido — mais estável que ela: "
                  f"{', '.join(acima)}")
        else:
            print(f"  {VERDE}{projeto}{RESET}: {alvo} (I={i_alvo:.2f}) é a "
                  f"camada mais estável do sistema")
    print()


if __name__ == "__main__":
    main()
