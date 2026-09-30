import { useState, type FormEvent } from "react";

import { cadeiras, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { Consulta, SituacaoConsulta } from "@/dominio";
import { Button, Modal, TextField, toast } from "@/ui";

import { rotuloDoDia } from "./dias";
import { emHora, emMinutos } from "./horarios";
import { cancelarConsulta, MOTIVO_MAX, mudarSituacao } from "./mudarSituacao";
import { ACAO_DA_SITUACAO, aguardaAtendimento, podeTransitar, ROTULO_DA_SITUACAO, transicoesDe } from "./situacao";

type Props = {
  consultaId: string;
  aoFechar: () => void;
  /** Remarcar é o formulário de marcar: quem abre este detalhe o fecha e abre aquele com a consulta. */
  aoRemarcar: (consulta: Consulta) => void;
};

/**
 * O detalhe da consulta, aberto pelo cartão da agenda: quem, quando, onde e a situação, com um botão para cada
 * passo do atendimento que a situação permite (o primeiro é o seguinte) e, enquanto a consulta aguarda o
 * atendimento, Remarcar e Cancelar consulta. Cancelar pede o motivo num campo que ocupa o lugar dos botões.
 * Mudar a situação e cancelar gravam e fecham: o foco volta ao cartão, que já mostra a situação nova. Lê a
 * consulta da coleção, e não de uma cópia: o que ela mostra e oferece é sempre o gravado.
 */
export default function DetalheDaConsulta({ consultaId, aoFechar, aoRemarcar }: Props) {
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erroDoMotivo, setErroDoMotivo] = useState("");
  const consulta = useColecao(consultas).find((c) => c.id === consultaId);
  const paciente = useColecao(pacientes).find((p) => p.id === consulta?.pacienteId);
  const profissional = useColecao(profissionais).find((p) => p.id === consulta?.profissionalId);
  const cadeira = useColecao(cadeiras).find((c) => c.id === consulta?.cadeiraId);
  const procedimento = useColecao(procedimentos).find((p) => p.id === consulta?.procedimentoId);
  if (!consulta) return null;

  const nome = paciente?.nome ?? "Paciente removido";
  const dia = consulta.inicio.slice(0, 10);
  const inicio = consulta.inicio.slice(11);
  const fim = emHora(emMinutos(inicio) + consulta.duracaoMin);
  const passos = transicoesDe(consulta.situacao).filter((s) => s !== "cancelada");
  const podeCancelar = podeTransitar(consulta.situacao, "cancelada");
  const podeRemarcar = aguardaAtendimento(consulta.situacao);
  const campos = [
    { rotulo: "Quando", valor: `${rotuloDoDia(dia)}, das ${inicio} às ${fim}`, largo: true },
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

  function cancelar(e: FormEvent) {
    e.preventDefault();
    const r = cancelarConsulta(consultaId, motivo);
    if (!r.ok) return setErroDoMotivo(r.erro);
    toast("Consulta cancelada", `${nome} · ${dia.slice(8, 10)}/${dia.slice(5, 7)} às ${inicio}`);
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

      {cancelando ? (
        <form onSubmit={cancelar} noValidate className="mt-6 grid gap-4">
          <TextField
            label="Motivo do cancelamento"
            value={motivo}
            maxLength={MOTIVO_MAX}
            autoFocus
            onChange={(e) => {
              setMotivo(e.target.value);
              setErroDoMotivo("");
            }}
            error={erroDoMotivo}
            aria-invalid={erroDoMotivo ? true : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Confirmar cancelamento</Button>
            <Button variant="ghost" onClick={() => setCancelando(false)}>
              Voltar
            </Button>
          </div>
        </form>
      ) : (
        <>
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
          {(podeRemarcar || podeCancelar) && (
            <div role="group" aria-label="Remarcar ou cancelar" className="mt-2 flex flex-wrap gap-2">
              {podeRemarcar && (
                <Button variant="ghost" onClick={() => aoRemarcar(consulta)}>
                  Remarcar
                </Button>
              )}
              {podeCancelar && (
                <Button variant="ghost" onClick={() => setCancelando(true)}>
                  {ACAO_DA_SITUACAO.cancelada}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
