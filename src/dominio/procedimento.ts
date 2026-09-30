import type { Centavos } from "./dinheiro";

/** Ato clínico do catálogo, que a clínica realiza e cobra. */
export type Procedimento = {
  id: string;
  nome: string;
  /** Área da odontologia (endodontia, periodontia…). Texto livre por ora: a lista do catálogo padrão vem no item 6.1. */
  especialidade: string;
  /** Preço de tabela. O item de um plano guarda a própria cópia (`ItemPlano.preco`). */
  preco: Centavos;
  /** Duração prevista, em minutos. */
  duracaoMin: number;
  /** O item do plano precisa dizer o dente. */
  exigeDente: boolean;
  /** O item do plano precisa dizer a face; implica `exigeDente`. */
  exigeFace: boolean;
  /** `false` tira da escolha para itens novos, sem apagar o que já foi orçado ou feito. */
  ativo: boolean;
};
