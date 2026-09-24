/**
 * Cálculo de percentis por interpolação linear.
 *
 * O autocannon não expõe o p95 — apenas p90 e p97_5 —, e a opção
 * `percentiles` só vale para a CLI. Como o p95 é uma das métricas exigidas,
 * os percentis são calculados aqui a partir das latências brutas coletadas
 * durante a execução.
 *
 * Para n observações ordenadas, a posição do percentil P é
 *
 *     pos = (P / 100) * (n - 1) + 1
 *
 * e, quando pos não é inteiro, interpola-se entre os vizinhos:
 *
 *     V = x[⌊pos⌋] + (pos - ⌊pos⌋) * (x[⌈pos⌉] - x[⌊pos⌋])
 */

/** Recebe as amostras já ordenadas em ordem crescente. */
function percentil(ordenadas, p) {
  if (!ordenadas.length) return null
  if (ordenadas.length === 1) return ordenadas[0]

  const pos = (p / 100) * (ordenadas.length - 1) + 1
  const piso = Math.floor(pos)
  const teto = Math.ceil(pos)

  const inferior = ordenadas[piso - 1]
  if (piso === teto) return inferior

  return inferior + (pos - piso) * (ordenadas[teto - 1] - inferior)
}

function media(amostras) {

  if (!amostras.length) return null

  return amostras.reduce((soma, x) => soma + x, 0) / amostras.length

}

module.exports = { percentil, media }
