// Os índices do exame como os cartões da tela os mostram: rótulo, valor formatado e a linha de apoio. Regra
// pura, sem React; os números são os de `indicesDoExame` (`exame.ts`).

import type { GlyphName, StatTone } from "@/ui";

import type { IndicesPerio } from "./exame";

export type CartaoDeIndice = { rotulo: string; valor: string; apoio: string; icone: GlyphName; tom?: StatTone };

// O percentual leva uma casa só quando não é inteiro (`33,3%`, `50%`): arredondar tudo para inteiro faria um
// sítio sangrando em duzentos e cinquenta virar `0%`. A média leva sempre uma, que é como a sonda a lê.
const percentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const profundidade = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const SEM_DADO = "—";

/** A base dos índices: os sítios medidos, isto é, com profundidade, nos dentes presentes. */
const medidos = (n: number) => (n === 0 ? "Nenhum sítio medido" : n === 1 ? "1 sítio medido" : `${n} sítios medidos`);

/**
 * Os quatro índices do exame, na ordem da tela. Sem nenhum sítio medido o percentual e a média não existem, e
 * aparecem como um traço. Os tons são fixos, sem faixa por limite: o app não sugere conduta clínica.
 */
export function cartoesDosIndices(i: IndicesPerio): CartaoDeIndice[] {
  const base = medidos(i.sitiosMedidos);
  return [
    {
      rotulo: "Sangramento à sondagem",
      valor: i.percentualSangramento === null ? SEM_DADO : `${percentual.format(i.percentualSangramento)}%`,
      apoio: base,
      icone: "tooth",
      tom: "red",
    },
    {
      rotulo: "Profundidade média (mm)",
      valor: i.profundidadeMedia === null ? SEM_DADO : profundidade.format(i.profundidadeMedia),
      apoio: base,
      icone: "chart",
    },
    {
      rotulo: "Profundidade ≥ 4 mm",
      valor: String(i.sitiosComProfundidade4mmOuMais),
      apoio: i.sitiosMedidos === 0 ? base : `de ${base}`,
      icone: "list",
    },
    { rotulo: "Inserção ≥ 3 mm", valor: String(i.sitiosComInsercao3mmOuMais), apoio: "sítios com profundidade e margem", icone: "list" },
  ];
}
