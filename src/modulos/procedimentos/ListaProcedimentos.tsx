import { useMemo, useState } from "react";

import { procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { formatarReais, type Procedimento } from "@/dominio";
import { Button, GlassCard, PageShell, TextField } from "@/ui";

import { especialidadesDe, filtrarProcedimentos } from "./busca";
import EditorDeProcedimento from "./EditorDeProcedimento";
import ReajusteDePrecos from "./ReajusteDePrecos";

const contagem = (n: number) => `${n} ${n === 1 ? "procedimento" : "procedimentos"}`;

/** O que o item do plano vai pedir ao escolher o procedimento: o dente, ou o dente e a face. */
const exigencia = (p: Procedimento) => (p.exigeFace ? "Exige dente e face" : p.exigeDente ? "Exige dente" : undefined);

/**
 * `/procedimentos`: a tabela de procedimentos da clínica, com busca por nome e código, filtro por especialidade, o
 * cadastro e a edição num modal e o reajuste de preços em lote sobre os selecionados.
 *
 * ponytail: a lista inteira vai para a tela, sem paginar. O catálogo tem dezenas de linhas; com centenas, o próximo
 * degrau é paginar ou agrupar por especialidade.
 */
export default function ListaProcedimentos() {
  const todos = useColecao(procedimentos);
  const [termo, setTermo] = useState("");
  const [escolhida, setEscolhida] = useState("");
  // `null`: modal fechado. `{}`: procedimento novo. `{ procedimento }`: edição dele.
  const [editor, setEditor] = useState<{ procedimento?: Procedimento } | null>(null);
  const [selecao, setSelecao] = useState<ReadonlySet<string>>(new Set());
  const [reajustando, setReajustando] = useState(false);
  const areas = useMemo(() => especialidadesDe(todos), [todos]);
  // A escolhida some da lista se o último procedimento dela mudar de área: o filtro volta a "Todas".
  const especialidade = areas.includes(escolhida) ? escolhida : "";
  const visiveis = useMemo(() => filtrarProcedimentos(todos, { termo, especialidade }), [todos, termo, especialidade]);
  const filtrando = termo.trim() !== "" || especialidade !== "";
  // O que se vê marcado é o que o reajuste alcança: o marcado que o filtro esconde continua na seleção, mas fica de fora.
  const marcados = useMemo(() => visiveis.filter((p) => selecao.has(p.id)), [visiveis, selecao]);
  const todosMarcados = visiveis.length > 0 && marcados.length === visiveis.length;

  const alternar = (id: string) =>
    setSelecao((s) => {
      const novo = new Set(s);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
  const alternarTodos = () =>
    setSelecao((s) => {
      const novo = new Set(s);
      for (const { id } of visiveis) {
        if (todosMarcados) novo.delete(id);
        else novo.add(id);
      }
      return novo;
    });

  return (
    <PageShell titulo="Procedimentos" detalhe="Cadastro">
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            className="min-w-[14rem] flex-1"
            label="Buscar procedimento"
            icon="ri-search-line"
            type="search"
            placeholder="Nome ou código"
            autoComplete="off"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <div className="w-full sm:w-56">
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
          <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setEditor({})}>
            <i className="ri-add-line text-base" aria-hidden="true" />
            Novo procedimento
          </Button>
        </div>

        {todos.length === 0 ? (
          <GlassCard className="mt-6 p-[26px] text-center">
            <p className="font-bold text-foreground-950">Nenhum procedimento cadastrado ainda</p>
            <p className="mt-1 text-foreground-500">Use Novo procedimento para cadastrar o primeiro, com preço e duração.</p>
          </GlassCard>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
              <label className="flex items-center gap-2 text-sm text-foreground-700">
                <input
                  type="checkbox"
                  checked={todosMarcados}
                  disabled={visiveis.length === 0}
                  onChange={alternarTodos}
                  className="h-4 w-4 accent-primary-800"
                />
                {filtrando ? "Selecionar os visíveis" : "Selecionar todos"}
              </label>
              {/* `role="status"`: quem usa leitor de tela ouve quantos sobraram a cada letra digitada. */}
              <p role="status" className="text-sm text-foreground-500">
                {filtrando ? `${visiveis.length} de ${contagem(todos.length)}` : contagem(todos.length)}
                {marcados.length > 0 && ` · ${marcados.length} ${marcados.length === 1 ? "selecionado" : "selecionados"}`}
              </p>
              <Button variant="secondary" className="w-full sm:ml-auto sm:w-auto" disabled={marcados.length === 0} onClick={() => setReajustando(true)}>
                Reajustar preços
              </Button>
            </div>

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
                    <li key={p.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <label className="flex min-w-0 cursor-pointer items-start gap-3 sm:flex-1">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${p.nome}`}
                          checked={selecao.has(p.id)}
                          onChange={() => alternar(p.id)}
                          className="mt-1 h-4 w-4 shrink-0 accent-primary-800"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground-950">{p.nome}</span>
                          <span className="block text-sm text-foreground-500">{[p.codigo, p.especialidade, exigencia(p)].filter(Boolean).join(" · ")}</span>
                        </span>
                      </label>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="sm:text-right">
                          <p className="font-bold tabular-nums text-foreground-950">{formatarReais(p.preco)}</p>
                          <p className="text-sm text-foreground-500">{p.duracaoMin} min</p>
                        </div>
                        <Button variant="ghost" aria-label={`Editar ${p.nome}`} onClick={() => setEditor({ procedimento: p })}>
                          Editar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </>
        )}

        {editor && <EditorDeProcedimento procedimento={editor.procedimento} aoFechar={() => setEditor(null)} />}
        {reajustando && (
          <ReajusteDePrecos escolhidos={marcados} aoFechar={() => setReajustando(false)} aoAplicar={() => setSelecao(new Set())} />
        )}
      </main>
    </PageShell>
  );
}
