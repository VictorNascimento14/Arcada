import { useMemo } from "react";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { cadeiraAtiva, type DataISO } from "@/dominio";
import { GlassCard } from "@/ui";

import CartaoDaConsulta from "./CartaoDaConsulta";
import { montarGrade } from "./grade";
import { diaDaSemana, emMinutos } from "./horarios";

/** Altura de uma hora na grade: uma consulta de 30 min ainda leva as três linhas do cartão. */
const REM_POR_HORA = 7;
/** Largura mínima de uma coluna: com mais cadeiras do que cabe na tela, a grade rola de lado. */
const REM_POR_COLUNA = 9;

// Posição e tamanho saem do horário, em runtime: vão em `style`, porque classe montada não existe.
const rem = (min: number) => `${+((min * REM_POR_HORA) / 60).toFixed(3)}rem`;

const achar = <T extends { id: string }>(itens: readonly T[], id?: string) => itens.find((i) => i.id === id);

/**
 * O dia da agenda: uma coluna por cadeira, o horário na vertical e cada consulta num cartão do tamanho da
 * duração. A grade cobre o expediente do dia e cresce para a consulta que cai fora dele.
 *
 * ponytail: cada cartão acha paciente, profissional e procedimento por `find` na lista inteira. Com dezenas
 * de consultas no dia e centenas de pacientes não pesa; com milhares, vira um `Map` por id.
 */
export default function GradeDoDia({ dia }: { dia: DataISO }) {
  const todas = useColecao(consultas);
  const todasAsCadeiras = useColecao(cadeiras);
  const listaDePacientes = useColecao(pacientes);
  const equipe = useColecao(profissionais);
  const catalogo = useColecao(procedimentos);
  const registro = useColecao(clinica).find((c) => c.id === CLINICA_ID);

  // A cancelada libera o horário e sai da grade; a que faltou continua ocupando e aparece.
  const doDia = useMemo(
    () => todas.filter((c) => c.inicio.startsWith(dia) && c.situacao !== "cancelada").sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [todas, dia],
  );
  const faixas = registro?.expediente[diaDaSemana(dia)] ?? [];
  const grade = montarGrade(faixas, doDia);
  // Cadeira inativa sai da agenda, menos no dia em que ainda tem consulta: marcada antes de inativar, não some.
  const colunas = todasAsCadeiras.filter((c) => cadeiraAtiva(c) || doDia.some((x) => x.cadeiraId === c.id));

  const n = doDia.length;
  const resumo = `${n === 0 ? "Nenhuma consulta" : `${n} ${n === 1 ? "consulta" : "consultas"}`} neste dia`;
  const aviso = faixas.length === 0 && n > 0 ? " — a clínica não atende neste dia" : "";
  const gradeCss = { gridTemplateColumns: `repeat(${colunas.length}, minmax(0, 1fr))` };

  return (
    <>
      {/* `role="status"`: quem usa leitor de tela ouve o resumo a cada dia que abre. */}
      <p role="status" className="mt-4 px-1 text-sm text-foreground-500">
        {resumo + aviso}
      </p>

      {colunas.length === 0 ? (
        <GlassCard className="mt-3 p-[26px] text-center">
          <p className="font-bold text-foreground-950">Nenhuma cadeira cadastrada</p>
          <p className="mt-1 text-foreground-500">Cadastre as cadeiras da clínica para ver a agenda por cadeira.</p>
        </GlassCard>
      ) : grade === null ? (
        <GlassCard className="mt-3 p-[26px] text-center">
          <p className="font-bold text-foreground-950">Clínica fechada neste dia</p>
          <p className="mt-1 text-foreground-500">O expediente da clínica não tem horário neste dia da semana.</p>
        </GlassCard>
      ) : (
        <GlassCard className="mt-3 p-3 md:p-4">
          <div className="flex">
            {/* Os rótulos de hora só orientam o olho: cada cartão já diz o próprio horário. */}
            <div aria-hidden="true" className="w-12 shrink-0">
              <div className="h-10" />
              <div className="relative" style={{ height: rem(grade.ate - grade.de) }}>
                {grade.horas.map((h) => (
                  <span
                    key={h.min}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-foreground-600"
                    style={{ top: rem(h.min - grade.de) }}
                  >
                    {h.rotulo}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 overflow-x-auto">
              <div style={{ minWidth: `${colunas.length * REM_POR_COLUNA}rem` }}>
                <div className="grid" style={gradeCss}>
                  {colunas.map((c) => (
                    <h3 key={c.id} className="flex h-10 items-center justify-center truncate px-2 text-sm font-bold text-foreground-950">
                      {c.nome}
                    </h3>
                  ))}
                </div>

                <div className="relative" style={{ height: rem(grade.ate - grade.de) }}>
                  {grade.horas.map((h) => (
                    <div
                      key={h.min}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-foreground-950/[0.07]"
                      style={{ top: rem(h.min - grade.de) }}
                    />
                  ))}
                  {grade.fechados.map((f) => (
                    <div
                      key={f.de}
                      aria-hidden="true"
                      className="absolute inset-x-0 bg-foreground-950/[0.05]"
                      style={{ top: rem(f.de - grade.de), height: rem(f.ate - f.de) }}
                    />
                  ))}

                  <div className="absolute inset-0 grid" style={gradeCss}>
                    {colunas.map((c) => (
                      <ul key={c.id} aria-label={`Consultas da ${c.nome}`} className="relative">
                        {doDia
                          .filter((x) => x.cadeiraId === c.id)
                          .map((x) => (
                            <li
                              key={x.id}
                              className="absolute inset-x-1"
                              style={{ top: rem(emMinutos(x.inicio.slice(11)) - grade.de), height: rem(x.duracaoMin) }}
                            >
                              <CartaoDaConsulta
                                consulta={x}
                                paciente={achar(listaDePacientes, x.pacienteId)}
                                profissional={achar(equipe, x.profissionalId)}
                                procedimento={achar(catalogo, x.procedimentoId)}
                              />
                            </li>
                          ))}
                      </ul>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </>
  );
}
