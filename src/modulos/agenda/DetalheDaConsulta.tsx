import { cadeiras, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { SituacaoConsulta } from "@/dominio";
import { Button, Modal, toast } from "@/ui";

import { rotuloDoDia } from "./dias";
import { emHora, emMinutos } from "./horarios";
import { mudarSituacao } from "./mudarSituacao";
import { ACAO_DA_SITUACAO, ROTULO_DA_SITUACAO, transicoesDe } from "./situacao";

type Props = {
  consultaId: string;
  aoFechar: () => void;
};

/**
 * O detalhe da consulta, aberto pelo cartão da agenda: quem, quando, onde e a situação, com um botão para cada
 * transição válida dela. O primeiro botão é o passo seguinte do atendimento. Mudar a situação grava e fecha: o
 * foco volta ao cartão, que já mostra a situação nova. Lê a consulta da coleção, e não de uma cópia: o que ela
 * mostra e oferece é sempre o gravado.
 *
 * ponytail: `cancelada` fica de fora dos botões. Cancelar pede o motivo e entra com o "remarcar e cancelar".
 */
export default function DetalheDaConsulta({ consultaId, aoFechar }: Props) {
  const consulta = useColecao(consultas).find((c) => c.id === consultaId);
  const paciente = useColecao(pacientes).find((p) => p.id === consulta?.pacienteId);
  const profissional = useColecao(profissionais).find((p) => p.id === consulta?.profissionalId);
  const cadeira = useColecao(cadeiras).find((c) => c.id === consulta?.cadeiraId);
  const procedimento = useColecao(procedimentos).find((p) => p.id === consulta?.procedimentoId);
  if (!consulta) return null;

  const nome = paciente?.nome ?? "Paciente removido";
  const inicio = consulta.inicio.slice(11);
  const fim = emHora(emMinutos(inicio) + consulta.duracaoMin);
  const passos = transicoesDe(consulta.situacao).filter((s) => s !== "cancelada");
  const campos = [
    { rotulo: "Quando", valor: `${rotuloDoDia(consulta.inicio.slice(0, 10))}, das ${inicio} às ${fim}`, largo: true },
    { rotulo: "Profissional", valor: profissional?.nome ?? "Profissional removido" },
    { rotulo: "Cadeira", valor: cadeira?.nome ?? "Cadeira removida" },
    { rotulo: "Procedimento", valor: procedimento?.nome ?? "Sem procedimento definido" },
    { rotulo: "Situação", valor: ROTULO_DA_SITUACAO[consulta.situacao] },
  ];

  function mudar(para: SituacaoConsulta) {
    const r = mudarSituacao(consultaId, para);
    if (!r.ok) return toast("Não foi possível mudar a situação", r.erro);
    toast("Situação atualizada", `${nome} · ${ROTULO_DA_SITUACAO[para]}`);
    aoFechar();
  }

  return (
    <Modal aberto titulo={`Consulta de ${nome}`} largura="lg" onFechar={aoFechar}>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {campos.map(({ rotulo, valor, largo }) => (
          <div key={rotulo} className={largo ? "sm:col-span-2" : ""}>
            <dt className="text-sm font-medium text-foreground-500">{rotulo}</dt>
            <dd className="mt-0.5 text-foreground-950">{valor}</dd>
          </div>
        ))}
      </dl>

      {passos.length > 0 ? (
        <div role="group" aria-label="Mudar a situação" className="mt-6 flex flex-wrap gap-2">
          {passos.map((s, i) => (
            <Button key={s} variant={i === 0 ? "primary" : "secondary"} onClick={() => mudar(s)}>
              {ACAO_DA_SITUACAO[s]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-foreground-500">Situação final: esta consulta não muda mais.</p>
      )}
    </Modal>
  );
}
