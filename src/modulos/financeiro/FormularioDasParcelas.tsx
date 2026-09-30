import { useId, useMemo, useState, type FormEvent } from "react";

import { formatarReais, type PlanoTratamento } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { total } from "@/modulos/tratamentos/plano";
import { Button, Modal, TextField, diaISO, toast } from "@/ui";

import { calcularParcelas, gerarParcelas, type CamposDasParcelas, type ErrosDasParcelas } from "./lancamentos";

/**
 * O modal de "Gerar parcelas": o número de parcelas e o 1º vencimento. Mostra as parcelas que vão nascer antes de
 * gerá-las, porque a v1 não desfaz o parcelamento. Só existe montado enquanto aberto: cada abertura começa do zero.
 */
export default function FormularioDasParcelas({ plano, aoFechar }: { plano: PlanoTratamento; aoFechar: () => void }) {
  const formId = useId();
  const [campos, setCampos] = useState<CamposDasParcelas>(() => ({ parcelas: "1", vencimento: diaISO(new Date()) }));
  const [erros, setErros] = useState<ErrosDasParcelas>({});
  const previa = useMemo(() => calcularParcelas(plano, campos), [plano, campos]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const novos = gerarParcelas(plano.id, campos);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    toast("Parcelas geradas");
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo="Gerar parcelas"
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Gerar parcelas
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate className="grid gap-4">
        <p className="flex items-baseline justify-between gap-4">
          <span className="text-foreground-500">Total do plano</span>
          <span className="text-lg font-bold tabular-nums text-foreground-950">{formatarReais(total(plano))}</span>
        </p>
        <TextField
          label="Número de parcelas"
          inputMode="numeric"
          value={campos.parcelas}
          onChange={(e) => setCampos((c) => ({ ...c, parcelas: e.target.value }))}
          error={erros.parcelas}
          aria-invalid={erros.parcelas ? true : undefined}
          autoComplete="off"
        />
        <TextField
          label="1º vencimento"
          type="date"
          hint="As outras vencem no mesmo dia dos meses seguintes."
          value={campos.vencimento}
          onChange={(e) => setCampos((c) => ({ ...c, vencimento: e.target.value }))}
          error={erros.vencimento}
          aria-invalid={erros.vencimento ? true : undefined}
        />
        {"parcelas" in previa && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground-700">Parcelas que serão geradas</p>
            <ol className="divide-y divide-foreground-950/[0.06] text-sm">
              {previa.parcelas.map((p, i) => (
                <li key={p.vencimento} className="flex items-baseline justify-between gap-4 py-1.5">
                  <span className="text-foreground-500">
                    {i + 1}ª · vence em {dataBR(p.vencimento)}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground-950">{formatarReais(p.valor)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </form>
    </Modal>
  );
}
