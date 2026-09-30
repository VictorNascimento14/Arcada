import { useMemo, useState } from "react";

import { procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, type Procedimento } from "@/dominio";
import { Button, GlassCard, PageShell, TextField } from "@/ui";

import { especialidadesDe, filtrarProcedimentos } from "./busca";

const contagem = (n: number) => `${n} ${n === 1 ? "procedimento" : "procedimentos"}`;

/** O que o item do plano vai pedir ao escolher o procedimento: o dente, ou o dente e a face. */
const exigencia = (p: Procedimento) => (p.exigeFace ? "Exige dente e face" : p.exigeDente ? "Exige dente" : undefined);

/**
 * `/procedimentos`: a tabela de procedimentos da clínica, com busca por nome e código e filtro por especialidade.
 *
 * ponytail: a lista inteira vai para a tela, sem paginar. O catálogo tem dezenas de linhas; com centenas, o próximo
 * degrau é paginar ou agrupar por especialidade.
 */
export default function ListaProcedimentos() {
  const todos = useColecao(procedimentos);
  const [termo, setTermo] = useState("");
  const [escolhida, setEscolhida] = useState("");
  const areas = useMemo(() => especialidadesDe(todos), [todos]);
  // A escolhida some da lista se o último procedimento dela mudar de área: o filtro volta a "Todas".
  const especialidade = areas.includes(escolhida) ? escolhida : "";
  const visiveis = useMemo(() => filtrarProcedimentos(todos, { termo, especialidade }), [todos, termo, especialidade]);
  const filtrando = termo.trim() !== "" || especialidade !== "";

  return (
    <PageShell titulo="Procedimentos" detalhe="Cadastro">
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          <TextField
            label="Buscar procedimento"
            icon="ri-search-line"
            type="search"
            placeholder="Nome ou código"
            autoComplete="off"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <div>
            <label htmlFor="procedimentos-especialidade" className="mb-1.5 block text-sm font-medium text-foreground-700">
              Especialidade
            </label>
            <select
              id="procedimentos-especialidade"
              value={especialidade}
              onChange={(e) => setEscolhida(e.target.value)}
              className="flex w-full items-center justify-between rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
            >
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {todos.length === 0 ? (
          <GlassCard className="mt-6 p-[26px] text-center">
            <p className="font-bold text-foreground-950">Nenhum procedimento cadastrado ainda</p>
            <p className="mt-1 text-foreground-500">Os procedimentos da clínica aparecem aqui, com preço e duração.</p>
          </GlassCard>
        ) : (
          <>
            {/* `role="status"`: quem usa leitor de tela ouve quantos sobraram a cada letra digitada. */}
            <p role="status" className="mt-4 px-1 text-sm text-foreground-500">
              {filtrando ? `${visiveis.length} de ${contagem(todos.length)}` : contagem(todos.length)}
            </p>

            {visiveis.length === 0 ? (
              <GlassCard className="mt-3 p-[26px] text-center">
                <p className="font-bold text-foreground-950">Nenhum procedimento encontrado</p>
                <p className="mt-1 text-foreground-500">Confira o nome, o código ou a especialidade escolhida.</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setTermo("");
                    setEscolhida("");
                  }}
                >
                  Limpar filtros
                </Button>
              </GlassCard>
            ) : (
              <GlassCard className="mt-3 p-2 md:p-3">
                <ul className="divide-y divide-foreground-950/[0.06]">
                  {visiveis.map((p) => (
                    <li key={p.id} className="flex items-center gap-4 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground-950">{p.nome}</p>
                        <p className="text-sm text-foreground-500">{[p.codigo, p.especialidade, exigencia(p)].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold tabular-nums text-foreground-950">{formatarReais(p.preco)}</p>
                        <p className="text-sm text-foreground-500">{p.duracaoMin} min</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
