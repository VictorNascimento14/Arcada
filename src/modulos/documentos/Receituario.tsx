import { useId, useState, type FormEvent } from "react";

import FolhaImpressa from "@/componentes/FolhaImpressa";
import { useImpressao } from "@/componentes/useImpressao";
import { pacientes, profissionais } from "@/dados/colecoes";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, diaISO, GlassCard, TextField } from "@/ui";

import PacienteEProfissional from "./PacienteEProfissional";
import {
  camposDoReceituario,
  LIMITE_DO_TEXTO,
  prepararReceituario,
  type CamposDoReceituario,
  type DadosDoReceituario,
  type ErrosDoReceituario,
} from "./receituario";

/**
 * O cartão do receituário: paciente, profissional, data e um texto livre. **Imprimir** abre a folha (cabeçalho da
 * clínica e linha para assinar à mão). O texto começa vazio e nada o sugere: medicamento, dose e conduta são de quem
 * escreve. A v1 é demonstração: sem assinatura digital nem validade jurídica.
 */
export default function Receituario() {
  const id = useId();
  const [campos, setCampos] = useState<CamposDoReceituario>(() => camposDoReceituario(diaISO(new Date())));
  const [erros, setErros] = useState<ErrosDoReceituario>({});
  const { folha, imprimir } = useImpressao<DadosDoReceituario>();

  const editar = (campo: keyof CamposDoReceituario, valor: string) => setCampos((c) => ({ ...c, [campo]: valor }));

  function enviar(e: FormEvent) {
    e.preventDefault();
    const r = prepararReceituario(campos, pacientes.listar(), profissionais.listar());
    setErros(r.ok ? {} : r.erros);
    if (r.ok) imprimir(r.dados);
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 id={`${id}-titulo`} className="text-xl font-bold tracking-[-0.01em] text-foreground-950">
        Receituário
      </h2>
      <p className="mt-1 text-foreground-500">Texto livre: o app não sugere medicamento, dose nem conduta.</p>

      <form onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`} className="mt-6 grid gap-4 md:grid-cols-2">
        <PacienteEProfissional
          id={id}
          pacienteId={campos.pacienteId}
          profissionalId={campos.profissionalId}
          erros={erros}
          aoMudar={editar}
        />
        <TextField
          label="Data"
          type="date"
          value={campos.data}
          onChange={(e) => editar("data", e.target.value)}
          error={erros.data}
          aria-invalid={erros.data ? true : undefined}
        />

        <div className="md:col-span-2">
          <label htmlFor={`${id}-texto`} className="mb-1.5 block text-sm font-medium text-foreground-700">
            Texto do receituário
          </label>
          <textarea
            id={`${id}-texto`}
            rows={10}
            maxLength={LIMITE_DO_TEXTO}
            value={campos.texto}
            onChange={(e) => editar("texto", e.target.value)}
            aria-invalid={erros.texto ? true : undefined}
            className="w-full rounded-[22px] border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
          />
          {erros.texto && <p className="mt-1.5 text-xs text-red-600">{erros.texto}</p>}
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
        <FolhaImpressa titulo="Receituário" profissional={folha.profissional}>
          <p>
            Paciente: <strong>{folha.paciente.nome}</strong>
          </p>
          <p>Data: {dataBR(folha.data)}</p>
          <p className="mt-6 whitespace-pre-wrap break-words">{folha.texto}</p>
        </FolhaImpressa>
      )}
    </GlassCard>
  );
}
