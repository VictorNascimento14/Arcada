import { useId, useState } from "react";

import type { Consulta } from "@/dominio";
import { Button, diaISO, GlassCard, PageShell } from "@/ui";

import CalendarioDoMes from "./CalendarioDoMes";
import DetalheDaConsulta from "./DetalheDaConsulta";
import { diasDaSemana, rotuloDaSemana, rotuloDoDia, somarDias } from "./dias";
import { feriadoDoDia } from "./feriados";
import GradeDaSemana from "./GradeDaSemana";
import GradeDoDia from "./GradeDoDia";
import MarcarConsulta from "./MarcarConsulta";

// A mesma pílula dos botões de mês do `Calendar` do kit.
const NAVEGAR =
  "glass-pill press flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-foreground-700 transition-colors hover:text-primary-800";

/**
 * A tela `/agenda`: o dia escolhido por cadeira, ou a semana dele, com a navegação de dia em dia (ou de semana em
 * semana) e o calendário do mês. Abre no dia de hoje. Clicar numa consulta abre o detalhe dela, de onde se muda a
 * situação, se remarca e se cancela. O calendário fica ao lado da grade em tela larga (`xl`); abaixo disso, atrás do botão Mês.
 */
export default function PaginaAgenda() {
  const [dia, setDia] = useState(() => diaISO(new Date()));
  const [semana, setSemana] = useState(false);
  // O formulário aberto: vazio, marca uma consulta; com `remarcar`, regrava aquela.
  const [marcando, setMarcando] = useState<{ remarcar?: Consulta } | null>(null);
  const [aberta, setAberta] = useState<string | null>(null); // o id da consulta com o detalhe aberto
  const [mesAberto, setMesAberto] = useState(false);
  const calendarioId = useId();
  const hoje = diaISO(new Date());
  const feriado = feriadoDoDia(dia);
  const passo = semana ? 7 : 1;
  // Na semana o calendário não fica ao lado: as sete colunas precisam da largura toda. O botão Mês o abre acima.
  const calendarioClasse = semana ? "mb-3 sm:max-w-[19rem]" : "xl:sticky xl:top-24 xl:block";
  const hojeNaTela = semana ? diasDaSemana(dia).includes(hoje) : dia === hoje;
  const abrirDia = (d: string) => {
    setDia(d);
    setMesAberto(false);
  };

  return (
    <PageShell titulo="Agenda" detalhe={semana ? "Visão da semana" : "Visão do dia"}>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label={semana ? "Semana anterior" : "Dia anterior"} className={NAVEGAR} onClick={() => setDia(somarDias(dia, -passo))}>
            <i className="ri-arrow-left-s-line" aria-hidden="true" />
          </button>
          <button type="button" aria-label={semana ? "Próxima semana" : "Próximo dia"} className={NAVEGAR} onClick={() => setDia(somarDias(dia, passo))}>
            <i className="ri-arrow-right-s-line" aria-hidden="true" />
          </button>
          <Button variant="secondary" disabled={hojeNaTela} onClick={() => setDia(hoje)}>
            Hoje
          </Button>
          <Button
            variant="secondary"
            className={semana ? "" : "xl:hidden"}
            aria-expanded={mesAberto}
            aria-controls={calendarioId}
            onClick={() => setMesAberto((aberto) => !aberto)}
          >
            <i className="ri-calendar-line text-base" aria-hidden="true" />
            Mês
          </Button>
          {/* No celular o título ocupa a linha de cima, inteiro. `first-letter:uppercase`, não `capitalize`: este faria "Quarta-Feira, 30 De Setembro". */}
          <h2 className="order-first basis-full text-[17px] font-bold tracking-[-0.01em] text-foreground-950 first-letter:uppercase md:order-none md:ml-1 md:min-w-0 md:flex-1">
            {semana ? rotuloDaSemana(dia) : rotuloDoDia(dia)}
          </h2>
          <div role="group" aria-label="Visão da agenda" className="flex gap-1">
            <Button variant={semana ? "secondary" : "primary"} aria-pressed={!semana} onClick={() => setSemana(false)}>
              Dia
            </Button>
            <Button variant={semana ? "primary" : "secondary"} aria-pressed={semana} onClick={() => setSemana(true)}>
              Semana
            </Button>
          </div>
          <Button onClick={() => setMarcando({})}>
            <i className="ri-add-line text-base" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Marcar consulta</span>
          </Button>
        </div>

        {!semana && feriado && (
          <GlassCard className="mt-3 flex items-center gap-3 p-4">
            <i className="ri-flag-line text-lg text-foreground-600" aria-hidden="true" />
            <p role="note" className="text-sm text-foreground-700">
              {`${feriado.tipo === "feriado" ? "Feriado" : "Ponto facultativo"}: ${feriado.nome}.`}
            </p>
          </GlassCard>
        )}

        <div className={`mt-3 ${semana ? "" : "xl:grid xl:grid-cols-[19rem_minmax(0,1fr)] xl:items-start xl:gap-4"}`}>
          <div id={calendarioId} className={`${mesAberto ? "block" : "hidden"} ${calendarioClasse}`}>
            <CalendarioDoMes aoAbrirDia={abrirDia} />
          </div>
          <div className="min-w-0">
            {semana ? (
              <GradeDaSemana
                dia={dia}
                aoAbrirConsulta={setAberta}
                aoAbrirDia={(d) => {
                  setDia(d);
                  setSemana(false);
                }}
              />
            ) : (
              <GradeDoDia dia={dia} aoAbrirConsulta={setAberta} />
            )}
          </div>
        </div>

        {aberta && (
          <DetalheDaConsulta
            consultaId={aberta}
            aoFechar={() => setAberta(null)}
            aoRemarcar={(c) => {
              setAberta(null);
              setMarcando({ remarcar: c });
            }}
          />
        )}

        {/* Ao marcar ou remarcar, a agenda abre no dia da consulta. */}
        {marcando && (
          <MarcarConsulta
            diaInicial={dia}
            remarcar={marcando.remarcar}
            aoFechar={() => setMarcando(null)}
            aoMarcar={(c) => setDia(c.inicio.slice(0, 10))}
          />
        )}
      </main>
    </PageShell>
  );
}
