import { StatCard } from "@/ui";

import { indicesDoExame, type ExamePerio } from "./exame";
import { cartoesDosIndices } from "./indices";

/**
 * Os índices do exame em cartões, acima da grade: recalculados a cada mudança do exame, sem botão de
 * atualizar. Os números são os de `indicesDoExame`; `cartoesDosIndices` só os formata.
 */
export default function IndicesDoExame({ dentes }: { dentes: ExamePerio }) {
  return (
    <section aria-label="Índices do exame" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cartoesDosIndices(indicesDoExame(dentes)).map((c) => (
        <StatCard key={c.rotulo} label={c.rotulo} value={c.valor} icon={c.icone} tone={c.tom} foot={c.apoio} />
      ))}
    </section>
  );
}
