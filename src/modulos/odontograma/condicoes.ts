// As condições que o odontograma registra: lista fechada, com o que cada uma vale (uma face ou o dente
// inteiro) e a cor da legenda. Elas só nomeiam o que o profissional registrou — nenhuma sugere conduta, e o
// app não decide tratamento.
//
// A cor é escrita por extenso, em classes LITERAIS: o JIT do Tailwind só gera o que está escrito no fonte, e
// uma classe montada em runtime (`text-${cor}-600`) nunca chega ao CSS. Cada condição tem uma cor só, numa
// classe `text-*`: o marcador da legenda a usa como `bg-current`, e o desenho de um dente, como
// `fill-current` ou `stroke-current`. As rampas `red` e `foreground` são do kit e trocam sozinhas no tema
// escuro; as outras são da paleta do Tailwind e trazem a variante `dark:`.

/** Onde a condição vale: numa face do dente ou no dente inteiro. */
export type EscopoCondicao = "face" | "dente";

export type Condicao = {
  /** Identificador estável, sem acento: é o que se guarda no dado. */
  id: string;
  rotulo: string;
  escopo: EscopoCondicao;
  /** Classes `text-*` literais da cor da condição (ver acima). */
  cor: string;
};

export const CONDICOES = [
  { id: "carie", rotulo: "Cárie", escopo: "face", cor: "text-red-600" },
  { id: "restauracao", rotulo: "Restauração", escopo: "face", cor: "text-blue-600 dark:text-blue-400" },
  { id: "selante", rotulo: "Selante", escopo: "face", cor: "text-cyan-600 dark:text-cyan-400" },
  { id: "fratura", rotulo: "Fratura", escopo: "dente", cor: "text-amber-600 dark:text-amber-400" },
  { id: "extracaoIndicada", rotulo: "Extração indicada", escopo: "dente", cor: "text-fuchsia-600 dark:text-fuchsia-400" },
  { id: "ausente", rotulo: "Ausente", escopo: "dente", cor: "text-foreground-500" },
  { id: "tratamentoDeCanal", rotulo: "Tratamento de canal", escopo: "dente", cor: "text-violet-600 dark:text-violet-400" },
  { id: "coroa", rotulo: "Coroa", escopo: "dente", cor: "text-lime-600 dark:text-lime-400" },
  { id: "implante", rotulo: "Implante", escopo: "dente", cor: "text-emerald-700 dark:text-emerald-400" },
] as const satisfies readonly Condicao[];

export type CondicaoId = (typeof CONDICOES)[number]["id"];
