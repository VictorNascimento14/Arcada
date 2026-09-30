import { useState, type FormEvent } from "react";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { Button, GlassCard, TextField, toast } from "@/ui";

import { adicionarConvenio, LIMITE_DO_NOME_DO_CONVENIO, removerConvenio } from "./convenios";

/** O cartão dos convênios aceitos: a lista, um campo para acrescentar e o botão de remover em cada nome. */
export default function Convenios() {
  const lista = useColecao(clinica).find((c) => c.id === CLINICA_ID)?.convenios ?? [];
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string>();

  function adicionar(e: FormEvent) {
    e.preventDefault();
    const novo = adicionarConvenio(nome);
    setErro(novo);
    if (novo) return;
    setNome("");
    toast("Convênio adicionado");
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Convênios aceitos</h2>
      <p className="mt-1 text-foreground-500">Os convênios que a clínica atende.</p>

      <form onSubmit={adicionar} noValidate className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <TextField
          className="sm:flex-1"
          label="Nome do convênio"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={erro}
          aria-invalid={erro ? true : undefined}
          maxLength={LIMITE_DO_NOME_DO_CONVENIO}
          autoComplete="off"
        />
        {/* `sm:mt-[1.625rem]`: a altura do rótulo do campo, para o botão ficar na linha do campo e não na do rótulo. */}
        <Button type="submit" className="w-full sm:mt-[1.625rem] sm:w-auto">
          <i className="ri-add-line text-base" aria-hidden="true" />
          Adicionar
        </Button>
      </form>

      {lista.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhum convênio cadastrado ainda.</p>
      ) : (
        <ul className="mt-4 divide-y divide-foreground-950/[0.06]">
          {lista.map((c) => (
            <li key={c} className="flex items-center gap-3 py-3">
              <p className="min-w-0 flex-1 truncate font-semibold text-foreground-950">{c}</p>
              <Button
                variant="ghost"
                aria-label={`Remover ${c}`}
                onClick={() => {
                  removerConvenio(c);
                  toast("Convênio removido");
                }}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
