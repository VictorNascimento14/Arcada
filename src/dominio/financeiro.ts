import type { DataISO } from "./datas";
import type { Centavos } from "./dinheiro";

export type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito";

/**
 * Um valor a receber de um paciente. Cada parcela de um orçamento aprovado é um lançamento (glossário do
 * cofre: Parcela). Fica em aberto até receber a baixa, que registra `pagoEm` e `forma`; o estorno da
 * baixa tira os dois.
 */
export type Lancamento = {
  id: string;
  pacienteId: string;
  /** O plano aprovado de onde a parcela nasceu. */
  planoId: string;
  valor: Centavos;
  vencimento: DataISO;
  /** Dia do pagamento; ausente é em aberto. Vem sempre junto com `forma`. */
  pagoEm?: DataISO;
  forma?: FormaPagamento;
};
