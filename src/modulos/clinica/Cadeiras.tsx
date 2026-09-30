import { useId, useMemo, useState, type FormEvent } from "react";

import { cadeiras } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { cadeiraAtiva, type Cadeira } from "@/dominio";
import { Button, GlassCard, Modal, TextField, toast } from "@/ui";

import { camposDaCadeira, LIMITE_DO_NOME_DA_CADEIRA, salvarCadeira, type CamposDaCadeira, type ErrosDaCadeira } from "./cadeiras";

/** Ativas primeiro, e cada grupo por nome, com o número por valor: `Cadeira 2` antes de `Cadeira 10`. */
const porAtivaENome = (a: Cadeira, b: Cadeira) =>
  Number(cadeiraAtiva(b)) - Number(cadeiraAtiva(a)) || a.nome.localeCompare(b.nome, "pt-BR", { numeric: true });

/** O cartão das cadeiras: a lista e o cadastro, num modal. */
export default function Cadeiras() {
  const todas = useColecao(cadeiras);
  const lista = useMemo(() => [...todas].sort(porAtivaENome), [todas]);
  // `null`: modal fechado. `{}`: cadeira nova. `{ cadeira }`: edição dela.
  const [editor, setEditor] = useState<{ cadeira?: Cadeira } | null>(null);

  return (
    <GlassCard className="p-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Cadeiras</h2>
          <p className="mt-1 text-foreground-500">Os postos de atendimento em que a agenda se organiza.</p>
        </div>
        <Button onClick={() => setEditor({})}>
          <i className="ri-add-line text-base" aria-hidden="true" />
          Nova cadeira
        </Button>
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhuma cadeira cadastrada ainda.</p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {lista.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <p className="min-w-0 flex-1 truncate font-semibold text-foreground-950">{c.nome}</p>
              {!cadeiraAtiva(c) && (
                <span className="rounded-full bg-foreground-950/[0.06] px-2.5 py-1 text-xs font-medium text-foreground-600">Inativa</span>
              )}
              <Button variant="ghost" aria-label={`Editar ${c.nome}`} onClick={() => setEditor({ cadeira: c })}>
                Editar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editor && <EditorDeCadeira cadeira={editor.cadeira} aoFechar={() => setEditor(null)} />}
    </GlassCard>
  );
}

/** O modal de cadastro e edição. Só existe montado enquanto aberto: cada abertura começa do zero. */
function EditorDeCadeira({ cadeira, aoFechar }: { cadeira?: Cadeira; aoFechar: () => void }) {
  const formId = useId();
  const [campos, setCampos] = useState<CamposDaCadeira>(() => camposDaCadeira(cadeira));
  const [erros, setErros] = useState<ErrosDaCadeira>({});

  function salvar(e: FormEvent) {
    e.preventDefault();
    const novos = salvarCadeira(campos, cadeira?.id);
    setErros(novos);
    if (novos.nome) return;
    toast(cadeira ? "Cadeira atualizada" : "Cadeira cadastrada");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo={cadeira ? "Editar cadeira" : "Nova cadeira"}
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
          hint="Como a cadeira aparece na agenda. Ex.: Cadeira 1"
          value={campos.nome}
          onChange={(e) => setCampos((c) => ({ ...c, nome: e.target.value }))}
          error={erros.nome}
          aria-invalid={erros.nome ? true : undefined}
          maxLength={LIMITE_DO_NOME_DA_CADEIRA}
          autoComplete="off"
        />
        <label className="flex items-start gap-2.5 text-sm text-foreground-700">
          <input
            type="checkbox"
            checked={campos.ativa}
            onChange={(e) => setCampos((c) => ({ ...c, ativa: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-primary-800"
          />
          <span>
            Cadeira ativa
            <span className="block text-xs text-foreground-500">Inativa continua no histórico, mas some das escolhas.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
