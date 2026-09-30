import { ROTULO_SITUACAO_DA_PARCELA, type SituacaoDaParcela } from "./situacao";

const COR: Record<SituacaoDaParcela, string> = {
  "a-vencer": "bg-secondary-100 text-secondary-800",
  "vence-hoje": "bg-accent-100 text-accent-800",
  vencida: "bg-red-100 text-red-700",
  paga: "bg-primary-100 text-primary-800",
};

/** A situação da parcela em uma pílula. A cor ajuda; quem diz é o texto. */
export default function SituacaoDaParcelaBadge({ situacao }: { situacao: SituacaoDaParcela }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COR[situacao]}`}>
      {ROTULO_SITUACAO_DA_PARCELA[situacao]}
    </span>
  );
}
