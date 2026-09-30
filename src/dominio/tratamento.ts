import type { Centavos } from "./dinheiro";
import type { Face, NumeroDente } from "./odontologia";

/**
 * `aprovado` gera as parcelas do financeiro (glossário do cofre: Orçamento). As transições permitidas
 * entre as situações são do item 7.6.
 */
export type SituacaoPlano = "proposto" | "aprovado" | "em-andamento" | "concluido" | "recusado";

/** Um procedimento proposto, ligado a um dente e às faces que ele pede (uma restauração MOD leva três). */
export type ItemPlano = {
  id: string;
  procedimentoId: string;
  dente?: NumeroDente;
  faces?: Face[];
  /** Preço do item quando entrou no plano, copiado do catálogo: reajustar o catálogo depois não muda o que já foi orçado. */
  preco: Centavos;
};

/** Plano de tratamento de um paciente; o orçamento é a proposta de valores dele. */
export type PlanoTratamento = {
  id: string;
  pacienteId: string;
  itens: ItemPlano[];
  /** Abatido da soma dos preços dos itens. O total não se guarda: calcula-se. */
  desconto: Centavos;
  situacao: SituacaoPlano;
};
