import type { Centavos } from "./dinheiro";

/** Ato clínico do catálogo, que a clínica realiza e cobra. */
export type Procedimento = {
  id: string;
  /** Código próprio da clínica (`PRE-02`), que se busca e se imprime. Não é o da TUSS. Ausente quando não foi dado um. */
  codigo?: string;
  nome: string;
  /** Área da odontologia (endodontia, periodontia…). Texto livre: o catálogo padrão usa as de `ESPECIALIDADES`, em `src/modulos/procedimentos/catalogo.ts`. */
  especialidade: string;
  /** Preço de tabela. O item de um plano guarda a própria cópia (`ItemPlano.preco`). */
  preco: Centavos;
  /** Duração prevista, em minutos. */
  duracaoMin: number;
  /** O item do plano precisa dizer o dente. */
  exigeDente: boolean;
  /** O item do plano precisa dizer a face; implica `exigeDente`. */
  exigeFace: boolean;
  /**
   * A condição que o procedimento realizado deixa no odontograma: o `id` de uma de `CONDICOES`
   * (`src/modulos/odontograma/condicoes.ts`). É texto porque o domínio não importa módulo. Ausente quando o
   * procedimento não muda o desenho do dente.
   */
  condicaoResultante?: string;
  /** `false` tira da escolha para itens novos, sem apagar o que já foi orçado ou feito. */
  ativo: boolean;
};
