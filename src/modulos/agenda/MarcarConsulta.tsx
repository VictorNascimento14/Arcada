import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { cadeiraAtiva, profissionalAtivo, type Consulta, type DataISO } from "@/dominio";
import { Button, Modal, TextField, toast } from "@/ui";

import { filtrarPacientes } from "../pacientes/busca";
import {
  camposDaMarcacao,
  camposDaRemarcacao,
  DURACAO_MAX,
  DURACAO_MIN,
  horariosSugeridos,
  marcarConsulta,
  remarcarConsulta,
  restricoesDaAgenda,
  textoDoAviso,
  textoDoBloqueio,
  type CamposDaMarcacao,
  type ErrosDaMarcacao,
} from "./marcar";

type SelecaoProps = {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  erro?: string;
  desabilitada?: boolean;
  children: ReactNode;
};

/** O `<select>` do sistema, com a mesma caixa do de `DadosDaClinica`. */
function Selecao({ id, rotulo, valor, aoMudar, erro, desabilitada, children }: SelecaoProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground-700">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        disabled={desabilitada}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        className="flex w-full items-center justify-between rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600 disabled:opacity-60"
      >
        {children}
      </select>
      {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

const nomeDe = <T extends { id: string; nome: string }>(lista: readonly T[], id: string) => lista.find((x) => x.id === id)?.nome ?? "";
const dataCurta = (dia: DataISO) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

type Props = {
  /** O dia que a agenda está mostrando: é a data com que o formulário abre. */
  diaInicial: DataISO;
  /** A consulta que se remarca: o formulário abre com os dados dela e regrava a mesma consulta. */
  remarcar?: Consulta;
  aoFechar: () => void;
  /** Chamado com a consulta gravada (marcada ou remarcada), antes de fechar. */
  aoMarcar: (consulta: Consulta) => void;
};

/**
 * O modal de marcar consulta. Só existe montado enquanto aberto: cada abertura começa do zero. Feriado e
 * conflito aparecem ao vivo e travam o botão; o ponto facultativo só avisa. Os horários livres do dia, para a
 * cadeira e o profissional escolhidos, viram botões que preenchem o início.
 *
 * Com `remarcar`, é o mesmo formulário regravando aquela consulta: abre com os dados dela, trava o paciente, e a
 * própria consulta não conta como conflito nem como horário ocupado.
 *
 * ponytail: o paciente é um `<select>` com a lista inteira, ordenada. Com centenas de pacientes, o próximo
 * degrau é uma busca como a da lista de pacientes.
 */
export default function MarcarConsulta({ diaInicial, remarcar, aoFechar, aoMarcar }: Props) {
  const formId = useId();
  const [campos, setCampos] = useState<CamposDaMarcacao>(() => (remarcar ? camposDaRemarcacao(remarcar) : camposDaMarcacao(diaInicial)));
  const [erros, setErros] = useState<ErrosDaMarcacao>({});

  const todas = useColecao(consultas);
  const listaDePacientes = useColecao(pacientes);
  const toda = useColecao(profissionais);
  const todasAsCadeiras = useColecao(cadeiras);
  const catalogo = useColecao(procedimentos).filter((p) => p.ativo);
  const registro = useColecao(clinica).find((c) => c.id === CLINICA_ID);
  const ordenados = useMemo(() => filtrarPacientes(listaDePacientes, ""), [listaDePacientes]);

  const editar = (campo: keyof CamposDaMarcacao) => (valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));
  const invalido = (campo: keyof CamposDaMarcacao) => (erros[campo] ? true : undefined);
  // Escolher o procedimento já traz a duração prevista dele; dá para ajustar em seguida.
  const escolherProcedimento = (id: string) => {
    const p = catalogo.find((x) => x.id === id);
    setCampos((c) => ({ ...c, procedimentoId: id, duracaoMin: p ? String(p.duracaoMin) : c.duracaoMin }));
  };

  const { bloqueios, aviso } = restricoesDaAgenda(campos, todas, remarcar?.id);
  const livres = registro ? horariosSugeridos(campos, todas, registro.expediente, remarcar?.id) : [];
  const semBase = !campos.cadeiraId && !campos.profissionalId;

  function enviar(e: FormEvent) {
    e.preventDefault();
    const r = remarcar ? remarcarConsulta(remarcar.id, campos) : marcarConsulta(campos);
    setErros(r.ok ? {} : r.erros);
    if (!r.ok) {
      // A consulta inteira barrada (já não existe, ou já não se remarca): não há campo a corrigir.
      if (r.erro) {
        toast("Não foi possível remarcar", r.erro);
        aoFechar();
      }
      return;
    }
    toast(
      remarcar ? "Consulta remarcada" : "Consulta marcada",
      `${nomeDe(listaDePacientes, r.consulta.pacienteId)} · ${dataCurta(campos.dia)} às ${campos.hora}`,
    );
    aoMarcar(r.consulta);
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo={remarcar ? "Remarcar consulta" : "Marcar consulta"}
      largura="lg"
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={bloqueios.length > 0}>
            {remarcar ? "Remarcar" : "Marcar"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Selecao
            id={`${formId}-paciente`}
            rotulo="Paciente"
            valor={campos.pacienteId}
            aoMudar={editar("pacienteId")}
            erro={erros.pacienteId}
            desabilitada={!!remarcar}
          >
            <option value="">Escolha o paciente</option>
            {ordenados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Selecao>
        </div>
        <Selecao id={`${formId}-profissional`} rotulo="Profissional" valor={campos.profissionalId} aoMudar={editar("profissionalId")} erro={erros.profissionalId}>
          <option value="">Escolha o profissional</option>
          {toda.filter(profissionalAtivo).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Selecao>
        <Selecao id={`${formId}-cadeira`} rotulo="Cadeira" valor={campos.cadeiraId} aoMudar={editar("cadeiraId")} erro={erros.cadeiraId}>
          <option value="">Escolha a cadeira</option>
          {todasAsCadeiras.filter(cadeiraAtiva).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Selecao>
        <div className="sm:col-span-2">
          <Selecao
            id={`${formId}-procedimento`}
            rotulo="Procedimento"
            valor={campos.procedimentoId}
            aoMudar={escolherProcedimento}
            erro={erros.procedimentoId}
            desabilitada={catalogo.length === 0}
          >
            <option value="">{catalogo.length === 0 ? "Nenhum procedimento cadastrado" : "Sem procedimento definido"}</option>
            {catalogo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo ? `${p.codigo} · ${p.nome}` : p.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-3">
          <TextField
            className="col-span-2 sm:col-span-1"
            label="Data"
            type="date"
            value={campos.dia}
            onChange={(e) => editar("dia")(e.target.value)}
            error={erros.dia}
            aria-invalid={invalido("dia")}
          />
          <TextField
            label="Início"
            type="time"
            step={900}
            value={campos.hora}
            onChange={(e) => editar("hora")(e.target.value)}
            error={erros.hora}
            aria-invalid={invalido("hora")}
          />
          <TextField
            label="Duração (min)"
            type="number"
            inputMode="numeric"
            min={DURACAO_MIN}
            max={DURACAO_MAX}
            step={5}
            value={campos.duracaoMin}
            onChange={(e) => editar("duracaoMin")(e.target.value)}
            error={erros.duracaoMin}
            aria-invalid={invalido("duracaoMin")}
          />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-foreground-700">Horários livres</p>
          {semBase ? (
            <p className="text-sm text-foreground-500">Escolha a cadeira ou o profissional para ver os horários livres.</p>
          ) : livres.length === 0 ? (
            <p className="text-sm text-foreground-500">Nenhum horário livre neste dia para essa duração.</p>
          ) : (
            <div role="group" aria-label="Horários livres" className="flex max-h-32 flex-wrap gap-2 overflow-y-auto p-0.5">
              {livres.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={campos.hora === h}
                  onClick={() => editar("hora")(h)}
                  className={`press cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    campos.hora === h
                      ? "bg-primary-900 text-primary-50"
                      : "bg-secondary-100 text-secondary-800 hover:bg-secondary-200"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {bloqueios.length > 0 && (
          <ul role="alert" className="grid gap-1 rounded-2xl border border-red-400 px-4 py-3 text-sm text-red-600 sm:col-span-2">
            {bloqueios.map((b) => (
              <li key={b.tipo === "feriado" ? b.feriado.dia : b.conflito.consulta.id}>
                {textoDoBloqueio(b, {
                  cadeira: nomeDe(todasAsCadeiras, campos.cadeiraId),
                  profissional: nomeDe(toda, campos.profissionalId),
                  paciente: nomeDe(listaDePacientes, b.tipo === "conflito" ? b.conflito.consulta.pacienteId : "") || "paciente removido",
                })}
              </li>
            ))}
          </ul>
        )}
        {aviso && (
          <p role="status" className="rounded-2xl border border-foreground-950/[0.10] px-4 py-3 text-sm text-foreground-700 sm:col-span-2">
            {textoDoAviso(aviso)}
          </p>
        )}
        {remarcar?.situacao === "confirmada" && (
          <p role="note" className="rounded-2xl border border-foreground-950/[0.10] px-4 py-3 text-sm text-foreground-700 sm:col-span-2">
            Esta consulta está confirmada. Ao remarcar, ela volta para agendada: o paciente precisa confirmar o novo horário.
          </p>
        )}
      </form>
    </Modal>
  );
}
