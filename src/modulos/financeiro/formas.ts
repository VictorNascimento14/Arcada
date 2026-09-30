import type { FormaPagamento } from "@/dominio";

/** Como o consultório chama cada forma de pagamento. A ordem das chaves é a ordem em que a baixa as oferece. */
export const ROTULO_DA_FORMA: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

export const FORMAS_DE_PAGAMENTO = Object.keys(ROTULO_DA_FORMA) as FormaPagamento[];
