import { useId, useState, type FormEvent } from "react";

import { formatarReais, type Procedimento } from "@/dominio";
import { Button, Modal, TextField, toast } from "@/ui";

import { aplicarReajuste, lerPercentual, reajustarPreco } from "./reajuste";

/**
 * O modal do reajuste em lote: o percentual, a prévia do preço atual e do novo de cada procedimento escolhido e, só
 * depois de confirmar, a gravação. Só existe montado enquanto aberto: cada abertura começa do zero. `aoAplicar` avisa
 * que gravou, para a lista limpar a seleção.
 */
export default function ReajusteDePrecos({
  escolhidos,
  aoFechar,
  aoAplicar,
}: {
  escolhidos: readonly Procedimento[];
  aoFechar: () => void;
  aoAplicar: () => void;
}) {
  const formId = useId();
  const [texto, setTexto] = useState("");
  const percentual = lerPercentual(texto);
  const previa = percentual === null ? [] : escolhidos.map((p) => ({ p, novo: reajustarPreco(p.preco, percentual) }));
  const mudam = previa.filter(({ p, novo }) => novo !== p.preco).length;
  const erro = texto.trim() !== "" && percentual === null ? "Informe um percentual de -100 a 1000, como 5 ou -10,5." : undefined;

  function aplicar(e: FormEvent) {
    e.preventDefault();
    if (percentual === null || mudam === 0) return;
    const alterados = aplicarReajuste(escolhidos.map((p) => p.id), percentual);
    toast(alterados === 1 ? "1 preço reajustado" : `${alterados} preços reajustados`);
    aoAplicar();
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo="Reajustar preços"
      onFechar={aoFechar}
      rodape={
        <>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={percentual === null || mudam === 0}>
            Aplicar reajuste
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={aplicar} noValidate className="grid gap-4">
        <TextField
          label="Percentual (%)"
          hint="Positivo aumenta e negativo reduz. Ex.: 5 ou -10,5"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          error={erro}
          aria-invalid={erro ? true : undefined}
          autoComplete="off"
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground-700">Prévia</p>
          {percentual === null ? (
            <p className="text-sm text-foreground-500">Digite o percentual para ver o preço novo de cada procedimento.</p>
          ) : (
            <>
              <ul className="max-h-64 divide-y divide-foreground-950/[0.06] overflow-y-auto">
                {previa.map(({ p, novo }) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 text-foreground-950">{p.nome}</span>
                    <span className="shrink-0 tabular-nums text-foreground-500">
                      <span className="sr-only">de </span>
                      {formatarReais(p.preco)}
                      <span className="sr-only"> para </span>
                      <span aria-hidden="true"> → </span>
                      <span className="font-bold text-foreground-950">{formatarReais(novo)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {mudam === 0 && <p className="mt-2 text-sm text-foreground-500">Nenhum preço muda com este percentual.</p>}
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
