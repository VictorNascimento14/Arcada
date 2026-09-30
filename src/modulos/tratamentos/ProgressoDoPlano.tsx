import type { PlanoTratamento } from "@/dominio";
import { MeterBar } from "@/ui";

import { progressoDoPlano } from "./progresso";

/**
 * O progresso do tratamento: uma `MeterBar` com os itens realizados sobre o total do plano, e o número ao lado.
 * Plano sem itens não tem o que medir, e o componente não desenha nada.
 */
export default function ProgressoDoPlano({ plano, className = "" }: { plano: PlanoTratamento; className?: string }) {
  const { feitos, total, pct } = progressoDoPlano(plano);
  if (total === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MeterBar
        pct={pct}
        height={7}
        className="min-w-0 flex-1"
        label={`Progresso do tratamento: ${feitos} de ${total} ${total === 1 ? "item realizado" : "itens realizados"}`}
      />
      {/* O rótulo da barra já diz isto ao leitor de tela; o texto é só para quem vê. */}
      <span aria-hidden="true" className="shrink-0 text-xs tabular-nums text-foreground-500">
        {`${feitos} de ${total} ${total === 1 ? "realizado" : "realizados"}`}
      </span>
    </div>
  );
}
