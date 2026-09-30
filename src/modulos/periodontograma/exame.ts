// O exame periodontal: os seis sítios de cada dente, o que se mede em cada um e os índices que saem dessas
// medidas. Tudo em milímetros. O nível de inserção clínica não se guarda: sai da conta.
//
// Convenção da margem gengival: positiva quando a margem está apical à junção esmalte-cemento (a recessão) e
// negativa quando está coronal a ela (gengiva que cobre parte da coroa). Assim o nível de inserção é a soma
// simples — profundidade + margem — e a recessão aumenta o nível, como perde suporte na boca.

import { denteValido, type NumeroDente } from "@/dominio";

/**
 * Os seis sítios de cada dente, na ordem em que a grade os desenha: três pelo lado vestibular (mesiovestibular,
 * vestibular, distovestibular) e três pelo lingual — palatino nos dentes superiores (mesiolingual, lingual,
 * distolingual).
 */
export const SITIOS = ["MV", "V", "DV", "ML", "L", "DL"] as const;

export type Sitio = (typeof SITIOS)[number];

/** O que se registra num sítio. Sítio sem profundidade ainda não foi medido. */
export type MedidaSitio = {
  /** Profundidade de sondagem, em mm: da margem da gengiva ao fundo do sulco. */
  profundidade?: number;
  /** Margem gengival, em mm, contada da junção esmalte-cemento: positiva é recessão; negativa, margem coronal à junção. */
  margem?: number;
  /** Sangramento à sondagem: houve ou não. */
  sangramento?: boolean;
  /** Supuração: houve saída de pus no sítio ou não. É só registro: nenhum índice do exame a conta. */
  supuracao?: boolean;
};

export type DentePerio = {
  /** Dente ausente fica fora de todos os índices, ainda que tenha medida registrada. */
  ausente?: boolean;
  sitios?: Partial<Record<Sitio, MedidaSitio>>;
};

/** O exame: os dentes que têm registro, pelo número FDI. Número que a FDI não tem é ignorado nas contas. */
export type ExamePerio = Partial<Record<NumeroDente, DentePerio>>;

/** Se `n` é uma medida registrada: número finito (campo vazio ou `NaN` de uma tela não conta). */
const numero = (n: number | undefined): n is number => Number.isFinite(n);

/** Nível de inserção clínica do sítio: profundidade + margem. `undefined` enquanto falta uma das duas. */
export function nivelDeInsercao({ profundidade, margem }: MedidaSitio): number | undefined {
  return numero(profundidade) && numero(margem) ? profundidade + margem : undefined;
}

export type IndicesPerio = {
  /** Sítios medidos (com profundidade) nos dentes presentes: a base do percentual e da média. */
  sitiosMedidos: number;
  /** Percentual dos sítios medidos com sangramento à sondagem; `null` quando nenhum foi medido. */
  percentualSangramento: number | null;
  /** Média da profundidade de sondagem, em mm; `null` quando nenhum sítio foi medido. */
  profundidadeMedia: number | null;
  sitiosComProfundidade4mmOuMais: number;
  /** Só entram os sítios que têm as duas medidas, profundidade e margem. */
  sitiosComInsercao3mmOuMais: number;
};

/**
 * Os índices do exame. Um sítio conta quando o dente está presente (existe na FDI e não é `ausente`) e o
 * sítio tem profundidade: sem ela ele ainda não foi medido, e um sangramento anotado nele fica de fora, para
 * o percentual nunca passar de 100. Os limites de 4 mm (profundidade) e de 3 mm (inserção) são os dos nomes
 * dos campos.
 */
export function indicesDoExame(exame: ExamePerio): IndicesPerio {
  let medidos = 0;
  let sangrando = 0;
  let soma = 0;
  let comProfundidade = 0;
  let comInsercao = 0;
  for (const dente of Object.keys(exame).map(Number).filter(denteValido)) {
    const registro = exame[dente];
    if (!registro || registro.ausente) continue;
    for (const sitio of SITIOS) {
      const medida = registro.sitios?.[sitio];
      if (!medida || !numero(medida.profundidade)) continue;
      medidos++;
      soma += medida.profundidade;
      if (medida.sangramento) sangrando++;
      if (medida.profundidade >= 4) comProfundidade++;
      const insercao = nivelDeInsercao(medida);
      if (insercao !== undefined && insercao >= 3) comInsercao++;
    }
  }
  return {
    sitiosMedidos: medidos,
    percentualSangramento: medidos ? (sangrando * 100) / medidos : null,
    profundidadeMedia: medidos ? soma / medidos : null,
    sitiosComProfundidade4mmOuMais: comProfundidade,
    sitiosComInsercao3mmOuMais: comInsercao,
  };
}
