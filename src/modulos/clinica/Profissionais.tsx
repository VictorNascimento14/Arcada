import { useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { profissionalAtivo, type Profissional } from "@/dominio";
import { Button, GlassCard, Modal, TextField, toast } from "@/ui";

import {
  camposDoProfissional,
  CORES_DA_AGENDA,
  LIMITES_DO_PROFISSIONAL,
  salvarProfissional,
  type CamposDoProfissional,
  type ErrosDoProfissional,
} from "./profissionais";

/** Ativos primeiro, e cada grupo por nome. */
const porAtivoENome = (a: Profissional, b: Profissional) =>
  Number(profissionalAtivo(b)) - Number(profissionalAtivo(a)) || a.nome.localeCompare(b.nome, "pt-BR");

/** O cartão da equipe: a lista de profissionais e o cadastro, num modal. */
export default function Profissionais() {
  const todos = useColecao(profissionais);
  const lista = useMemo(() => [...todos].sort(porAtivoENome), [todos]);
  // `null`: modal fechado. `{}`: profissional novo. `{ profissional }`: edição dele.
  const [editor, setEditor] = useState<{ profissional?: Profissional } | null>(null);

  return (
    <GlassCard className="p-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Profissionais</h2>
          <p className="mt-1 text-foreground-500">Quem atende, com o registro no CRO e a cor na agenda.</p>
        </div>
        <Button onClick={() => setEditor({})}>
          <i className="ri-add-line text-base" aria-hidden="true" />
          Novo profissional
        </Button>
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhum profissional cadastrado ainda.</p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: p.cor }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground-950">{p.nome}</p>
                <p className="truncate text-sm text-foreground-500">{[p.cro, p.especialidade].filter(Boolean).join(" · ")}</p>
              </div>
              {!profissionalAtivo(p) && (
                <span className="rounded-full bg-foreground-950/[0.06] px-2.5 py-1 text-xs font-medium text-foreground-600">Inativo</span>
              )}
              <Button variant="ghost" aria-label={`Editar ${p.nome}`} onClick={() => setEditor({ profissional: p })}>
                Editar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editor && <EditorDeProfissional profissional={editor.profissional} aoFechar={() => setEditor(null)} />}
    </GlassCard>
  );
}

/** O modal de cadastro e edição. Só existe montado enquanto aberto: cada abertura começa do zero. */
function EditorDeProfissional({ profissional, aoFechar }: { profissional?: Profissional; aoFechar: () => void }) {
  const formId = useId();
  const [campos, setCampos] = useState<CamposDoProfissional>(() => camposDoProfissional(profissional));
  const [erros, setErros] = useState<ErrosDoProfissional>({});

  const editar = (campo: "nome" | "cro" | "especialidade") => (e: ChangeEvent<HTMLInputElement>) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));
  const invalido = (campo: keyof ErrosDoProfissional) => (erros[campo] ? true : undefined);

  function salvar(e: FormEvent) {
    e.preventDefault();
    const novos = salvarProfissional(campos, profissional?.id);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    toast(profissional ? "Profissional atualizado" : "Profissional cadastrado");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo={profissional ? "Editar profissional" : "Novo profissional"}
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
          maxLength={LIMITES_DO_PROFISSIONAL.nome}
          autoComplete="off"
        />
        <TextField
          label="Registro no CRO"
          hint="Ex.: CRO-SP 00000"
          value={campos.cro}
          onChange={editar("cro")}
          error={erros.cro}
          aria-invalid={invalido("cro")}
          autoComplete="off"
        />
        <TextField
          label="Especialidade (opcional)"
          value={campos.especialidade}
          onChange={editar("especialidade")}
          error={erros.especialidade}
          aria-invalid={invalido("especialidade")}
          maxLength={LIMITES_DO_PROFISSIONAL.especialidade}
          autoComplete="off"
        />

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-foreground-700">Cor na agenda</legend>
          <div className="flex flex-wrap gap-3 p-1">
            {CORES_DA_AGENDA.map((cor) => (
              <label key={cor.valor} className="cursor-pointer">
                <input
                  type="radio"
                  name={`${formId}-cor`}
                  value={cor.valor}
                  checked={campos.cor === cor.valor}
                  onChange={() => setCampos((c) => ({ ...c, cor: cor.valor }))}
                  className="peer sr-only"
                />
                <span className="sr-only">{cor.nome}</span>
                <span
                  aria-hidden="true"
                  className="block h-8 w-8 rounded-full outline outline-2 outline-offset-2 outline-transparent transition-colors peer-checked:outline-foreground-950 peer-focus-visible:outline-foreground-950"
                  style={{ backgroundColor: cor.valor }}
                />
              </label>
            ))}
          </div>
          {erros.cor && <p className="mt-1.5 text-xs text-red-600">{erros.cor}</p>}
        </fieldset>

        <label className="flex items-start gap-2.5 text-sm text-foreground-700">
          <input
            type="checkbox"
            checked={campos.ativo}
            onChange={(e) => setCampos((c) => ({ ...c, ativo: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-primary-800"
          />
          <span>
            Profissional ativo
            <span className="block text-xs text-foreground-500">Inativo continua no histórico, mas some das escolhas.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
