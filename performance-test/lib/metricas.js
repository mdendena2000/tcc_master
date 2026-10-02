const { percentil, media } = require("./percentis")

/**
 * Throughput conta apenas respostas 2xx — 4xx e 5xx são requisições
 * processadas, mas não com sucesso.
 *
 * Latência média e percentis saem das latências coletadas requisição a
 * requisição, porque o autocannon não expõe o p95.
 */
function calcularMetricas({ resultado, latencias }, duracaoPadrao) {
  const ordenadas = [...latencias].sort((a, b) => a - b)

  const sucesso    = resultado["2xx"] || 0
  const naoSucesso = resultado.non2xx || 0
  const conexao    = resultado.errors || 0
  const duracao    = resultado.duration || duracaoPadrao

  // Timeouts já entram em `errors`; somá-los de novo contaria duas vezes.
  const tentativas = sucesso + naoSucesso + conexao

  return {
    throughput: duracao ? sucesso / duracao : null,
    media:      media(ordenadas),
    p50:        percentil(ordenadas, 50),
    p95:        percentil(ordenadas, 95),
    p99:        percentil(ordenadas, 99),
    taxaErro:   tentativas ? (naoSucesso + conexao) / tentativas : 0,
    tentativas,
  }
}

/**
 * Média e desvio padrão amostral de uma série de medições.
 *
 * O desvio divide por n-1, e não por n, porque a média usada no cálculo saiu
 * das próprias medições: ela já está centrada nelas, e os afastamentos saem
 * menores do que seriam em relação à média verdadeira. Dividir por n-1
 * corrige esse viés (correção de Bessel).
 *
 * Com uma única medição o desvio é indeterminável, e devolvê-lo como zero
 * faria uma execução de `--repeticoes 1` parecer perfeitamente estável.
 */
function agregar(valores) {
  const validos = valores.filter((v) => v != null)
  if (!validos.length) return { media: null, desvio: null, cv: null, n: 0 }

  const m = validos.reduce((s, v) => s + v, 0) / validos.length
  const desvio =
    validos.length > 1
      ? Math.sqrt(
          validos.reduce((s, v) => s + (v - m) ** 2, 0) / (validos.length - 1)
        )
      : null

  return {
    media: m,
    desvio,
    cv: m && desvio != null ? desvio / m : null,
    n: validos.length,
  }
}

module.exports = { calcularMetricas, agregar }
