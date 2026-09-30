import { useId, useState, type FormEvent } from "react";

import { formatarReais, type PlanoTratamento } from "@/dominio";
import { Button, GlassCard, TextField, toast } from "@/ui";

import { lerDesconto, type TipoDeDesconto } from "./desconto";
import { ACAO_DA_SITUACAO } from "./exibicao";
import { subtotal, total } from "./plano";
import { definirDesconto, mudarSituacao } from "./planos";
import { proximasSituacoes } from "./situacao";

const LINHA = "flex items-baseline justify-between gap-4";

/**
 * O orçamento do plano: subtotal, desconto e total, o campo do desconto (só com o plano proposto) e os botões
 * que levam o plano à próxima situação.
 */
export default function OrcamentoDoPlano({ plano }: { plano: PlanoTratamento }) {
  const idDoTipo = useId();
  const [tipo, setTipo] = useState<TipoDeDesconto>("percentual");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();

  const proposto = plano.situacao === "proposto";
  const bruto = subtotal(plano);
  const final = total(plano);
  const proximas = proximasSituacoes(plano.situacao);

  function aplicar(e: FormEvent) {
    e.preventDefault();
    const desconto = lerDesconto(tipo, texto);
    if (!desconto) {
      setErro(tipo === "percentual" ? "Informe o percentual, como 10 ou 12,5." : "Informe o valor, como 50,00.");
      return;
    }
    definirDesconto(plano.id, desconto);
    setErro(undefined);
    setTexto("");
    toast("Desconto aplicado");
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Orçamento</h2>

      {/* O desconto que vale é o que cabe no subtotal: `total` já limita, e a linha mostra a diferença real. */}
      <dl className="mt-4 grid gap-2">
        <div className={LINHA}>
          <dt className="text-foreground-500">Subtotal</dt>
          <dd className="tabular-nums text-foreground-950">{formatarReais(bruto)}</dd>
        </div>
        <div className={LINHA}>
          <dt className="text-foreground-500">Desconto</dt>
          <dd className="tabular-nums text-foreground-950">{bruto > final ? `− ${formatarReais(bruto - final)}` : formatarReais(0)}</dd>
        </div>
        <div className={`${LINHA} border-t border-foreground-950/[0.06] pt-3`}>
          <dt className="font-semibold text-foreground-950">Total</dt>
          <dd className="text-xl font-bold tabular-nums text-foreground-950">{formatarReais(final)}</dd>
        </div>
      </dl>

      {proposto && (
        <form onSubmit={aplicar} noValidate className="mt-5 grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-start">
          <div>
            <label htmlFor={idDoTipo} className="mb-1.5 block text-sm font-medium text-foreground-700">
              Tipo do desconto
            </label>
            <select
              id={idDoTipo}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoDeDesconto);
                setErro(undefined);
              }}
              className="w-full rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
            >
              <option value="percentual">Percentual (%)</option>
              <option value="valor">Valor (R$)</option>
            </select>
          </div>
          <TextField
            label={tipo === "percentual" ? "Percentual de desconto" : "Valor do desconto"}
            hint="Zero tira o desconto."
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            error={erro}
            aria-invalid={erro ? true : undefined}
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" className="sm:mt-[1.625rem]">
            Aplicar desconto
          </Button>
        </form>
      )}

      {proximas.length > 0 && (
        <div className="mt-6 border-t border-foreground-950/[0.06] pt-5">
          {/* ponytail: sem confirmação nos botões. Toda transição é sem volta na v1; se a recusa por engano pesar, confirmar antes de `recusado`. */}
          <div className="flex flex-wrap gap-2">
            {proximas.map((para) => (
              <Button
                key={para}
                variant={para === "recusado" ? "secondary" : "primary"}
                disabled={para === "aprovado" && plano.itens.length === 0}
                onClick={() => mudarSituacao(plano.id, para)}
              >
                {ACAO_DA_SITUACAO[para]}
              </Button>
            ))}
          </div>
          {proposto && plano.itens.length === 0 && <p className="mt-2 text-xs text-foreground-500">Adicione ao menos um item para aprovar o plano.</p>}
        </div>
      )}
    </GlassCard>
  );
}
