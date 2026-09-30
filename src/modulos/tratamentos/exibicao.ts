import { denteValido, nomeDente, nomeFace, type ItemPlano, type SituacaoPlano } from "@/dominio";

export const ROTULO_SITUACAO: Record<SituacaoPlano, string> = {
  proposto: "Proposto",
  aprovado: "Aprovado",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  recusado: "Recusado",
};

/** O que diz o botão que leva o plano a cada situação. `proposto` é o começo: nenhuma transição chega nele. */
export const ACAO_DA_SITUACAO: Record<SituacaoPlano, string> = {
  proposto: "Propor",
  aprovado: "Aprovar",
  "em-andamento": "Iniciar tratamento",
  concluido: "Concluir",
  recusado: "Recusar",
};

/** `1 item`, `3 itens`. */
export const rotuloItens = (n: number) => `${n} ${n === 1 ? "item" : "itens"}`;

/**
 * Em que dente o item se aplica, em texto: `Dente 16 · primeiro molar superior direito · faces mesial, oclusal`.
 * Vazio para o item que não pede dente. Um dente que a notação não conhece (dado antigo ou mexido à mão) fica
 * só com o número, em vez de derrubar a tela.
 */
export function detalheDoItem(item: ItemPlano): string {
  if (item.dente === undefined) return "";
  const faces = item.faces ?? [];
  return [
    `Dente ${item.dente}`,
    denteValido(item.dente) ? nomeDente(item.dente) : "",
    faces.length > 0 ? `${faces.length === 1 ? "face" : "faces"} ${faces.map((f) => nomeFace(f)).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
