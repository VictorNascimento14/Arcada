import { useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { Procedimento } from "@/dominio";
import { Button, Modal, TextField, toast } from "@/ui";

import {
  camposDoProcedimento,
  especialidadesOferecidas,
  LIMITES_DO_PROCEDIMENTO,
  salvarProcedimento,
  type CamposDoProcedimento,
  type ErrosDoProcedimento,
} from "./cadastro";

/**
 * O modal de cadastro e edição de procedimento. Só existe montado enquanto aberto: cada abertura começa do
 * zero. Sem `procedimento`, cadastra um novo.
 */
export default function EditorDeProcedimento({ procedimento, aoFechar }: { procedimento?: Procedimento; aoFechar: () => void }) {
  const formId = useId();
  const todos = useColecao(procedimentos);
  const areas = useMemo(() => especialidadesOferecidas(todos), [todos]);
  const [campos, setCampos] = useState<CamposDoProcedimento>(() => camposDoProcedimento(procedimento));
  const [erros, setErros] = useState<ErrosDoProcedimento>({});

  const editar = (campo: "nome" | "codigo" | "preco" | "duracao") => (e: ChangeEvent<HTMLInputElement>) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));
  const invalido = (campo: keyof ErrosDoProcedimento) => (erros[campo] ? true : undefined);

  function salvar(e: FormEvent) {
    e.preventDefault();
    const novos = salvarProcedimento(campos, procedimento?.id);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    toast(procedimento ? "Procedimento atualizado" : "Procedimento cadastrado");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo={procedimento ? "Editar procedimento" : "Novo procedimento"}
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Salvar
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={salvar} noValidate className="grid gap-4">
        <TextField
          label="Nome"
          value={campos.nome}
          onChange={editar("nome")}
          error={erros.nome}
          aria-invalid={invalido("nome")}
          maxLength={LIMITES_DO_PROCEDIMENTO.nome}
          autoComplete="off"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${formId}-especialidade`} className="mb-1.5 block text-sm font-medium text-foreground-700">
              Especialidade
            </label>
            <select
              id={`${formId}-especialidade`}
              value={campos.especialidade}
              onChange={(e) => setCampos((c) => ({ ...c, especialidade: e.target.value }))}
              aria-invalid={invalido("especialidade")}
              className="flex w-full items-center justify-between rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
            >
              <option value="">Escolha…</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            {erros.especialidade && <p className="mt-1.5 text-xs text-red-600">{erros.especialidade}</p>}
          </div>
          <TextField
            label="Código (opcional)"
            hint="Ex.: PRE-02"
            value={campos.codigo}
            onChange={editar("codigo")}
            error={erros.codigo}
            aria-invalid={invalido("codigo")}
            maxLength={LIMITES_DO_PROCEDIMENTO.codigo}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Preço (R$)"
            hint="Ex.: 180,00"
            inputMode="decimal"
            value={campos.preco}
            onChange={editar("preco")}
            error={erros.preco}
            aria-invalid={invalido("preco")}
            autoComplete="off"
          />
          <TextField
            label="Duração (minutos)"
            hint={`De 1 a ${LIMITES_DO_PROCEDIMENTO.duracaoMin}`}
            inputMode="numeric"
            value={campos.duracao}
            onChange={editar("duracao")}
            error={erros.duracao}
            aria-invalid={invalido("duracao")}
            autoComplete="off"
          />
        </div>

        <fieldset className="grid gap-3">
          <legend className="mb-1.5 block text-sm font-medium text-foreground-700">No plano de tratamento</legend>
          <label className="flex items-start gap-2.5 text-sm text-foreground-700">
            <input
              type="checkbox"
              checked={campos.exigeDente}
              // Sem o dente não há face para pedir: desmarcar o dente desmarca a face.
              onChange={(e) => setCampos((c) => ({ ...c, exigeDente: e.target.checked, exigeFace: e.target.checked && c.exigeFace }))}
              className="mt-0.5 h-4 w-4 accent-primary-800"
            />
            <span>
              Exige dente
              <span className="block text-xs text-foreground-500">O item precisa dizer o dente. Ex.: restauração, canal, exodontia.</span>
            </span>
          </label>
          <label className={`flex items-start gap-2.5 text-sm ${campos.exigeDente ? "text-foreground-700" : "text-foreground-500"}`}>
            <input
              type="checkbox"
              checked={campos.exigeFace}
              disabled={!campos.exigeDente}
              onChange={(e) => setCampos((c) => ({ ...c, exigeFace: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-primary-800 disabled:cursor-not-allowed"
            />
            <span>
              Exige face
              <span className="block text-xs text-foreground-500">Precisa dizer também a face; só com o dente. Ex.: restauração, selante.</span>
            </span>
          </label>
          {erros.exigeFace && <p className="text-xs text-red-600">{erros.exigeFace}</p>}
        </fieldset>
      </form>
    </Modal>
  );
}
