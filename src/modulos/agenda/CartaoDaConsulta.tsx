import type { Consulta, Paciente, Procedimento, Profissional } from "@/dominio";

import { emHora, emMinutos } from "./horarios";
import { ROTULO_DA_SITUACAO } from "./situacao";

type Props = {
  consulta: Consulta;
  /** Ausentes quando o cadastro foi removido depois da marcação: o cartão diz, em vez de sumir. */
  paciente?: Paciente;
  profissional?: Profissional;
  procedimento?: Procedimento;
};

/**
 * A consulta na grade do dia: paciente, horário (e procedimento, quando a consulta tem um), situação e
 * profissional — nessa ordem, porque em coluna estreita é o nome do profissional que o `truncate` corta. A cor do profissional é uma cor CSS qualquer (`#1f6f5b`), por isso vai em `style`: classe do
 * Tailwind montada em runtime não existe. O cartão preenche o `<li>` que a grade posiciona.
 */
export default function CartaoDaConsulta({ consulta, paciente, profissional, procedimento }: Props) {
  const inicio = consulta.inicio.slice(11);
  const fim = emHora(emMinutos(inicio) + consulta.duracaoMin);
  const cor = profissional?.cor;

  return (
    <article
      className="h-full overflow-hidden rounded-xl border border-l-4 border-foreground-950/[0.08] bg-foreground-950/[0.04] px-2 py-1 text-xs leading-4"
      style={cor ? { borderLeftColor: cor, backgroundColor: `color-mix(in srgb, ${cor} 16%, transparent)` } : undefined}
    >
      <p className="truncate text-[13px] font-bold text-foreground-950">{paciente?.nome ?? "Paciente removido"}</p>
      <p className="truncate text-foreground-600">{`${inicio}–${fim}${procedimento ? ` · ${procedimento.nome}` : ""}`}</p>
      <p className="truncate text-foreground-600">{`${ROTULO_DA_SITUACAO[consulta.situacao]} · ${profissional?.nome ?? "Profissional removido"}`}</p>
    </article>
  );
}
