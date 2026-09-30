import { useId, useMemo, useState, type FormEvent } from "react";

import { procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { facesDoDente, nomeFace } from "@/dominio";
import { Button, Modal, TextField, toast } from "@/ui";

import {
  alternarFace,
  CAMPOS_VAZIOS,
  DENTES_PARA_ESCOLHER,
  escolherDente,
  escolherProcedimento,
  procedimentosParaEscolher,
  rotuloDoDente,
  type CamposDoItem,
  type ErrosDoItem,
} from "./itens";
import { adicionarItem } from "./planos";

// O kit não tem `<select>` próprio: é o nativo, com a receita de campo do `TextField` (a lista abre animada pelo CSS).
const SELECT =
  "w-full rounded-full border bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600";
const BORDA = "border-foreground-950/[0.10]";
const BORDA_ERRO = "border-red-400";
const ROTULO = "mb-1.5 block text-sm font-medium text-foreground-700";
const ERRO = "mt-1.5 text-xs text-red-600";

/**
 * O modal de novo item: o procedimento e, se ele pede, o dente e as faces daquele dente. O preço parte da tabela.
 * Só existe montado enquanto aberto: cada abertura começa do zero.
 */
export default function FormularioDoItem({ planoId, aoFechar }: { planoId: string; aoFechar: () => void }) {
  const formId = useId();
  const catalogo = useColecao(procedimentos);
  const grupos = useMemo(() => procedimentosParaEscolher(catalogo), [catalogo]);
  const [campos, setCampos] = useState<CamposDoItem>(CAMPOS_VAZIOS);
  const [erros, setErros] = useState<ErrosDoItem>({});

  const procedimento = catalogo.find((p) => p.id === campos.procedimentoId);
  const pedeFace = procedimento?.exigeFace === true;
  const pedeDente = pedeFace || procedimento?.exigeDente === true;
  const faces = pedeFace && campos.dente !== "" ? facesDoDente(Number(campos.dente)) : [];

  function enviar(e: FormEvent) {
    e.preventDefault();
    const novos = adicionarItem(planoId, campos);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    toast("Item adicionado ao plano");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo="Adicionar item"
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Adicionar ao plano
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate className="grid gap-4">
        <div>
          <label htmlFor={`${formId}-procedimento`} className={ROTULO}>
            Procedimento
          </label>
          <select
            id={`${formId}-procedimento`}
            value={campos.procedimentoId}
            onChange={(e) => {
              const id = e.target.value;
              setCampos((c) => escolherProcedimento(c, catalogo.find((p) => p.id === id)));
            }}
            aria-invalid={erros.procedimentoId ? true : undefined}
            className={`${SELECT} ${erros.procedimentoId ? BORDA_ERRO : BORDA}`}
          >
            <option value="">Escolha o procedimento</option>
            {grupos.map((g) => (
              <optgroup key={g.especialidade} label={g.especialidade}>
                {g.procedimentos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} · ${p.nome}` : p.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {erros.procedimentoId && <p className={ERRO}>{erros.procedimentoId}</p>}
        </div>

        {pedeDente && (
          <div>
            <label htmlFor={`${formId}-dente`} className={ROTULO}>
              Dente
            </label>
            <select
              id={`${formId}-dente`}
              value={campos.dente}
              onChange={(e) => {
                const dente = e.target.value;
                setCampos((c) => escolherDente(c, dente));
              }}
              aria-invalid={erros.dente ? true : undefined}
              className={`${SELECT} ${erros.dente ? BORDA_ERRO : BORDA}`}
            >
              <option value="">Escolha o dente</option>
              {DENTES_PARA_ESCOLHER.map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.dentes.map((d) => (
                    <option key={d} value={d}>
                      {rotuloDoDente(d)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {erros.dente && <p className={ERRO}>{erros.dente}</p>}
          </div>
        )}

        {pedeFace && (
          <fieldset>
            <legend className={ROTULO}>Faces</legend>
            {faces.length === 0 ? (
              <p className="text-sm text-foreground-500">Escolha o dente para ver as faces dele.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {faces.map((face) => (
                  <label
                    key={face}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-foreground-950/[0.10] bg-surface/70 px-4 py-2 text-sm text-foreground-700"
                  >
                    <input
                      type="checkbox"
                      checked={campos.faces.includes(face)}
                      onChange={() => setCampos((c) => alternarFace(c, face))}
                      className="h-4 w-4 accent-primary-800"
                    />
                    <span>
                      <span className="font-semibold text-foreground-950">{face}</span> {nomeFace(face)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {erros.faces && <p className={ERRO}>{erros.faces}</p>}
          </fieldset>
        )}

        <TextField
          label="Preço"
          hint="Vem da tabela de procedimentos; ajuste se o valor combinado for outro."
          inputMode="decimal"
          value={campos.preco}
          onChange={(e) => setCampos((c) => ({ ...c, preco: e.target.value }))}
          error={erros.preco}
          aria-invalid={erros.preco ? true : undefined}
          autoComplete="off"
        />
      </form>
    </Modal>
  );
}
