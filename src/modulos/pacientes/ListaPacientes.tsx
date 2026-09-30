import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { Avatar, Button, diaISO, GlassCard, PageShell, TextField } from "@/ui";
import { filtrarPacientes } from "./busca";
import { anosDoPaciente, rotuloConvenio, rotuloIdade } from "./exibicao";

const contagem = (n: number) => `${n} ${n === 1 ? "paciente" : "pacientes"}`;

/**
 * `/pacientes`: a lista com busca por nome e telefone. Cada cartão leva à ficha.
 *
 * ponytail: a lista inteira vai para a tela, sem paginar nem virtualizar. A demo tem dezenas de pacientes;
 * com centenas de cartões de vidro, o próximo degrau é paginar.
 */
export default function ListaPacientes() {
  const todos = useColecao(pacientes);
  const [termo, setTermo] = useState("");
  const visiveis = useMemo(() => filtrarPacientes(todos, termo), [todos, termo]);
  const filtrando = termo.trim() !== "";
  const hoje = diaISO(new Date());

  return (
    <PageShell titulo="Pacientes">
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField
            className="sm:flex-1"
            label="Buscar paciente"
            icon="ri-search-line"
            type="search"
            placeholder="Nome ou telefone"
            autoComplete="off"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <Link
            to="/pacientes/novo"
            className="press inline-flex items-center justify-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold whitespace-nowrap text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
          >
            <i className="ri-user-add-line" aria-hidden="true" />
            Novo paciente
          </Link>
        </div>

        {todos.length === 0 ? (
          <GlassCard className="mt-6 p-[26px] text-center">
            <p className="font-bold text-foreground-950">Nenhum paciente cadastrado ainda</p>
            <p className="mt-1 text-foreground-500">Os pacientes cadastrados aparecem aqui, com busca por nome e telefone.</p>
          </GlassCard>
        ) : (
          <>
            {/* `role="status"`: quem usa leitor de tela ouve quantos sobraram a cada letra digitada. */}
            <p role="status" className="mt-4 px-1 text-sm text-foreground-500">
              {filtrando ? `${visiveis.length} de ${contagem(todos.length)}` : contagem(todos.length)}
            </p>

            {visiveis.length === 0 ? (
              <GlassCard className="mt-3 p-[26px] text-center">
                <p className="font-bold text-foreground-950">Nenhum paciente encontrado</p>
                <p className="mt-1 text-foreground-500">Confira o nome ou o telefone digitado.</p>
                <Button variant="secondary" className="mt-4" onClick={() => setTermo("")}>
                  Limpar busca
                </Button>
              </GlassCard>
            ) : (
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {visiveis.map((p) => {
                  const anos = anosDoPaciente(p, hoje);
                  return (
                    <li key={p.id}>
                      {/* O raio do link é o do vidro (26px): o anel de foco acompanha o cartão. */}
                      <Link to={`/pacientes/${p.id}`} className="block rounded-[26px]">
                        <GlassCard interactive className="flex items-center gap-4 p-4">
                          <span aria-hidden="true">
                            <Avatar nome={p.nome} size={48} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground-950">{p.nome}</p>
                            <p className="truncate text-sm text-foreground-500">
                              {anos === null ? rotuloConvenio(p) : `${rotuloIdade(anos)} · ${rotuloConvenio(p)}`}
                            </p>
                            {p.telefone && <p className="truncate text-sm text-foreground-500">{p.telefone}</p>}
                          </div>
                        </GlassCard>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
