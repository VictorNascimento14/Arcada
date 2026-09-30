import { useId, useState, type FormEvent } from "react";

import { formatarReais, type Lancamento } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, Modal, TextField, diaISO, toast } from "@/ui";

import { FORMAS_DE_PAGAMENTO, ROTULO_DA_FORMA } from "./formas";
import { darBaixa, type CamposDaBaixa, type ErrosDaBaixa } from "./lancamentos";

// O kit não tem `<select>` próprio: é o nativo, com a receita de campo do `TextField` (a lista abre animada pelo CSS).
const SELECT =
  "w-full rounded-full border bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600";
const LINHA = "flex items-baseline justify-between gap-4";

/**
 * O modal da baixa: a forma e o dia do pagamento (hoje, de partida). O valor não se edita — a baixa quita a parcela
 * inteira. Só existe montado enquanto aberto: cada abertura começa do zero.
 */
export default function FormularioDaBaixa({ parcela, aoFechar }: { parcela: Lancamento; aoFechar: () => void }) {
  const formId = useId();
  const hoje = diaISO(new Date());
  const [campos, setCampos] = useState<CamposDaBaixa>(() => ({ forma: "", data: hoje }));
  const [erros, setErros] = useState<ErrosDaBaixa>({});

  function enviar(e: FormEvent) {
    e.preventDefault();
    const novos = darBaixa(parcela.id, campos, hoje);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    toast("Baixa registrada");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo="Dar baixa"
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Dar baixa
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate className="grid gap-4">
        <dl className="grid gap-1.5">
          <div className={LINHA}>
            <dt className="text-foreground-500">Valor da parcela</dt>
            <dd className="text-lg font-bold tabular-nums text-foreground-950">{formatarReais(parcela.valor)}</dd>
          </div>
          <div className={LINHA}>
            <dt className="text-foreground-500">Vencimento</dt>
            <dd className="tabular-nums text-foreground-950">{dataBR(parcela.vencimento)}</dd>
          </div>
        </dl>
        <p className="text-sm text-foreground-500">A baixa quita a parcela inteira.</p>

        <div>
          <label htmlFor={`${formId}-forma`} className="mb-1.5 block text-sm font-medium text-foreground-700">
            Forma de pagamento
          </label>
          <select
            id={`${formId}-forma`}
            value={campos.forma}
            onChange={(e) => setCampos((c) => ({ ...c, forma: e.target.value }))}
            aria-invalid={erros.forma ? true : undefined}
            className={`${SELECT} ${erros.forma ? "border-red-400" : "border-foreground-950/[0.10]"}`}
          >
            <option value="">Escolha a forma</option>
            {FORMAS_DE_PAGAMENTO.map((forma) => (
              <option key={forma} value={forma}>
                {ROTULO_DA_FORMA[forma]}
              </option>
            ))}
          </select>
          {erros.forma && <p className="mt-1.5 text-xs text-red-600">{erros.forma}</p>}
        </div>

        <TextField
          label="Data do pagamento"
          type="date"
          max={hoje}
          value={campos.data}
          onChange={(e) => setCampos((c) => ({ ...c, data: e.target.value }))}
          error={erros.data}
          aria-invalid={erros.data ? true : undefined}
        />
      </form>
    </Modal>
  );
}
