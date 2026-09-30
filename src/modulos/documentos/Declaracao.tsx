import { useId, useMemo, useState, type FormEvent } from "react";

import FolhaImpressa from "@/componentes/FolhaImpressa";
import { useImpressao } from "@/componentes/useImpressao";
import { consultas, pacientes, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { ROTULO_DA_SITUACAO } from "@/modulos/agenda/situacao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, diaISO, GlassCard, TextField } from "@/ui";

import {
  camposDaDeclaracao,
  consultasDoPaciente,
  horarioDaConsulta,
  prepararDeclaracao,
  type CamposDaDeclaracao,
  type DadosDaDeclaracao,
  type ErrosDaDeclaracao,
} from "./declaracao";
import PacienteEProfissional from "./PacienteEProfissional";
import Selecao from "./Selecao";

/**
 * O cartão da declaração de comparecimento: paciente, profissional, a data e o horário de início e de fim. Depois de
 * escolher o paciente, dá para preencher a data e as horas a partir de uma consulta dele; elas seguem editáveis.
 * **Imprimir** abre a folha (cabeçalho da clínica e linha para assinar à mão). A v1 é demonstração: sem assinatura
 * digital nem validade jurídica.
 */
export default function Declaracao() {
  const id = useId();
  const [campos, setCampos] = useState<CamposDaDeclaracao>(() => camposDaDeclaracao(diaISO(new Date())));
  const [erros, setErros] = useState<ErrosDaDeclaracao>({});
  const { folha, imprimir } = useImpressao<DadosDaDeclaracao>();
  const todas = useColecao(consultas);
  const doPaciente = useMemo(() => consultasDoPaciente(todas, campos.pacienteId), [todas, campos.pacienteId]);

  const editar = (campo: keyof CamposDaDeclaracao, valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));
  const invalido = (campo: keyof ErrosDaDeclaracao) => (erros[campo] ? true : undefined);
  // Trocar de paciente solta a consulta escolhida, que era de outro; a data e as horas ficam como estão.
  const escolher = (campo: "pacienteId" | "profissionalId", valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor, ...(campo === "pacienteId" ? { consultaId: "" } : {}) }));
  const usarConsulta = (consultaId: string) => {
    const consulta = doPaciente.find((c) => c.id === consultaId);
    setCampos((c) => ({ ...c, consultaId, ...(consulta ? horarioDaConsulta(consulta) : {}) }));
  };

  function enviar(e: FormEvent) {
    e.preventDefault();
    const r = prepararDeclaracao(campos, pacientes.listar(), profissionais.listar());
    setErros(r.ok ? {} : r.erros);
    if (r.ok) imprimir(r.dados);
  }

  const semConsulta = doPaciente.length === 0;

  return (
    <GlassCard className="p-[26px]">
      <h2 id={`${id}-titulo`} className="text-xl font-bold tracking-[-0.01em] text-foreground-950">
        Declaração de comparecimento
      </h2>
      <p className="mt-1 text-foreground-500">
        O paciente esteve na clínica no horário informado. Escolha uma consulta dele para preencher a data e as horas.
      </p>

      <form onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`} className="mt-6 grid gap-4 md:grid-cols-2">
        <PacienteEProfissional
          id={id}
          pacienteId={campos.pacienteId}
          profissionalId={campos.profissionalId}
          erros={erros}
          aoMudar={escolher}
        />
        <div className="md:col-span-2">
          <Selecao
            id={`${id}-consulta`}
            rotulo="Consulta do paciente"
            valor={campos.consultaId}
            aoMudar={usarConsulta}
            desabilitada={semConsulta}
          >
            <option value="">
              {!campos.pacienteId
                ? "Escolha o paciente primeiro"
                : semConsulta
                  ? "Nenhuma consulta deste paciente"
                  : "Preencher a partir de uma consulta"}
            </option>
            {doPaciente.map((c) => {
              const { data, horaInicio, horaFim } = horarioDaConsulta(c);
              return (
                <option key={c.id} value={c.id}>
                  {`${dataBR(data)} · ${horaInicio} às ${horaFim} · ${ROTULO_DA_SITUACAO[c.situacao]}`}
                </option>
              );
            })}
          </Selecao>
        </div>

        <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
          <TextField
            className="col-span-2 md:col-span-1"
            label="Data"
            type="date"
            value={campos.data}
            onChange={(e) => editar("data", e.target.value)}
            error={erros.data}
            aria-invalid={invalido("data")}
          />
          <TextField
            label="Hora de início"
            type="time"
            value={campos.horaInicio}
            onChange={(e) => editar("horaInicio", e.target.value)}
            error={erros.horaInicio}
            aria-invalid={invalido("horaInicio")}
          />
          <TextField
            label="Hora de fim"
            type="time"
            value={campos.horaFim}
            onChange={(e) => editar("horaFim", e.target.value)}
            error={erros.horaFim}
            aria-invalid={invalido("horaFim")}
          />
        </div>

        {/* Quem usa leitor de tela ouve todos os erros de uma vez; quem enxerga já tem cada um no seu campo. */}
        {Object.keys(erros).length > 0 && (
          <p role="alert" className="sr-only">
            {Object.values(erros).join(" ")}
          </p>
        )}

        <div className="flex justify-end md:col-span-2">
          <Button type="submit">
            <i className="ri-printer-line" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </form>

      {folha && (
        <FolhaImpressa titulo="Declaração de comparecimento" profissional={folha.profissional}>
          <p className="leading-relaxed text-balance">
            Declaro que <strong>{folha.paciente.nome}</strong> compareceu a esta clínica no dia {folha.quando}.
          </p>
        </FolhaImpressa>
      )}
    </GlassCard>
  );
}
