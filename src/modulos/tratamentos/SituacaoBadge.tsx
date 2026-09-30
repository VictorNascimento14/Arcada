import type { SituacaoPlano } from "@/dominio";

import { ROTULO_SITUACAO } from "./exibicao";

const COR: Record<SituacaoPlano, string> = {
  proposto: "bg-secondary-100 text-secondary-800",
  aprovado: "bg-primary-100 text-primary-800",
  "em-andamento": "bg-accent-100 text-accent-800",
  concluido: "bg-primary-900 text-primary-50",
  recusado: "bg-foreground-950/[0.06] text-foreground-600",
};

/** A situação do plano em uma pílula. A cor ajuda; quem diz é o texto. */
export default function SituacaoBadge({ situacao }: { situacao: SituacaoPlano }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COR[situacao]}`}>
      {ROTULO_SITUACAO[situacao]}
    </span>
  );
}
