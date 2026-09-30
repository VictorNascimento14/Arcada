import type { Consulta, Paciente, Procedimento, Profissional } from "@/dominio";

import { emHora, emMinutos } from "./horarios";
import { ROTULO_DA_SITUACAO } from "./situacao";

type Props = {
  consulta: Consulta;
  /** Ausentes quando o cadastro foi removido depois da marcação: o cartão diz, em vez de sumir. */
  paciente?: Paciente;
  profissional?: Profissional;
  procedimento?: Procedimento;
  /** O nome da cadeira, numa linha a mais: só na visão da semana, onde a coluna é o dia e não a cadeira. */
  cadeira?: string;
  /** Abre o detalhe da consulta, onde se muda a situação. */
  aoAbrir: () => void;
};

/**
 * A consulta na grade do dia: paciente, horário (e procedimento, quando a consulta tem um), situação e
 * profissional — nessa ordem, porque em coluna estreita é o nome do profissional que o `truncate` corta. A cor do
 * profissional é uma cor CSS qualquer (`#1f6f5b`), por isso vai em `style`: classe do Tailwind montada em runtime
 * não existe. O cartão preenche o `<li>` que a grade posiciona e é, inteiro, o botão que abre o detalhe (com
 * `<span>`, não `<p>`: parágrafo não cabe dentro de botão).
 */
export default function CartaoDaConsulta({ consulta, paciente, profissional, procedimento, cadeira, aoAbrir }: Props) {
  const inicio = consulta.inicio.slice(11);
  const fim = emHora(emMinutos(inicio) + consulta.duracaoMin);
  const cor = profissional?.cor;

  return (
    <article
      className="h-full overflow-hidden rounded-xl border border-l-4 border-foreground-950/[0.08] bg-foreground-950/[0.04]"
      style={cor ? { borderLeftColor: cor, backgroundColor: `color-mix(in srgb, ${cor} 16%, transparent)` } : undefined}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={aoAbrir}
        className="block h-full w-full cursor-pointer px-2 py-1 text-left text-xs leading-4 transition-colors hover:bg-foreground-950/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
      >
        <span className="block truncate text-[13px] font-bold text-foreground-950">{paciente?.nome ?? "Paciente removido"}</span>
        <span className="block truncate text-foreground-600">{`${inicio}–${fim}${procedimento ? ` · ${procedimento.nome}` : ""}`}</span>
        <span className="block truncate text-foreground-600">{`${ROTULO_DA_SITUACAO[consulta.situacao]} · ${profissional?.nome ?? "Profissional removido"}`}</span>
        {cadeira && <span className="block truncate text-foreground-600">{cadeira}</span>}
      </button>
    </article>
  );
}
