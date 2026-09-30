import { useId, useState, type FormEvent } from "react";

import FolhaImpressa from "@/componentes/FolhaImpressa";
import { useImpressao } from "@/componentes/useImpressao";
import { pacientes, profissionais } from "@/dados/colecoes";
import { Button, diaISO, GlassCard, TextField } from "@/ui";

import {
  camposDoAtestado,
  LIMITE_DA_FINALIDADE,
  prepararAtestado,
  type CamposDoAtestado,
  type DadosDoAtestado,
  type ErrosDoAtestado,
} from "./atestado";
import PacienteEProfissional from "./PacienteEProfissional";

/**
 * O cartão do atestado: paciente, profissional, o período (data e hora de início e de fim) e a finalidade em texto
 * livre. **Imprimir** abre a folha (cabeçalho da clínica e linha para assinar à mão). O app não escreve o atestado:
 * período e finalidade são de quem emite. A v1 é demonstração: sem assinatura digital nem validade jurídica.
 */
export default function Atestado() {
  const id = useId();
  const [campos, setCampos] = useState<CamposDoAtestado>(() => camposDoAtestado(diaISO(new Date())));
  const [erros, setErros] = useState<ErrosDoAtestado>({});
  const { folha, imprimir } = useImpressao<DadosDoAtestado>();

  const editar = (campo: keyof CamposDoAtestado, valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));
  const invalido = (campo: keyof ErrosDoAtestado) => (erros[campo] ? true : undefined);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const r = prepararAtestado(campos, pacientes.listar(), profissionais.listar());
    setErros(r.ok ? {} : r.erros);
    if (r.ok) imprimir(r.dados);
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 id={`${id}-titulo`} className="text-xl font-bold tracking-[-0.01em] text-foreground-950">
        Atestado
      </h2>
      <p className="mt-1 text-foreground-500">O período e a finalidade são de quem emite: o app não escreve o atestado.</p>

      <form onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`} className="mt-6 grid gap-4 md:grid-cols-2">
        <PacienteEProfissional
          id={id}
          pacienteId={campos.pacienteId}
          profissionalId={campos.profissionalId}
          erros={erros}
          aoMudar={editar}
        />
        <TextField
          label="Data de início"
          type="date"
          value={campos.dataInicio}
          onChange={(e) => editar("dataInicio", e.target.value)}
          error={erros.dataInicio}
          aria-invalid={invalido("dataInicio")}
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
          label="Data de fim"
          type="date"
          value={campos.dataFim}
          onChange={(e) => editar("dataFim", e.target.value)}
          error={erros.dataFim}
          aria-invalid={invalido("dataFim")}
        />
        <TextField
          label="Hora de fim"
          type="time"
          value={campos.horaFim}
          onChange={(e) => editar("horaFim", e.target.value)}
          error={erros.horaFim}
          aria-invalid={invalido("horaFim")}
        />

        <div className="md:col-span-2">
          <label htmlFor={`${id}-finalidade`} className="mb-1.5 block text-sm font-medium text-foreground-700">
            Finalidade
          </label>
          <textarea
            id={`${id}-finalidade`}
            rows={4}
            maxLength={LIMITE_DA_FINALIDADE}
            value={campos.finalidade}
            onChange={(e) => editar("finalidade", e.target.value)}
            aria-invalid={invalido("finalidade")}
            className="w-full rounded-[22px] border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
          />
          {erros.finalidade && <p className="mt-1.5 text-xs text-red-600">{erros.finalidade}</p>}
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
        <FolhaImpressa titulo="Atestado" profissional={folha.profissional}>
          <p>
            Paciente: <strong>{folha.paciente.nome}</strong>
          </p>
          <p>Período: {folha.periodo}</p>
          <p className="mt-6 font-semibold">Finalidade</p>
          <p className="whitespace-pre-wrap break-words">{folha.finalidade}</p>
        </FolhaImpressa>
      )}
    </GlassCard>
  );
}
