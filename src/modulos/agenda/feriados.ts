/**
 * Feriados nacionais do Brasil, para a agenda.
 *
 * Só o que vale no país inteiro: feriado estadual ou municipal é decisão da clínica.
 * As datas saem como `AAAA-MM-DD` por aritmética em UTC — sem fuso e sem
 * `toISOString()` —, então o resultado é o mesmo em qualquer máquina, de dia ou de noite.
 */

export type Feriado = {
  /** `AAAA-MM-DD`. */
  dia: string;
  nome: string;
  /** `feriado` bloqueia a agenda; `facultativo` só avisa — quem decide se abre é a clínica. */
  tipo: "feriado" | "facultativo";
};

// A Páscoa de Meeus/Jones/Butcher vale para o calendário gregoriano (de 1583 em diante);
// 9999 é o último ano que cabe em `AAAA`. Fora disso a função não responde.
const ANO_MIN = 1583;
const ANO_MAX = 9999;

const anoSuportado = (ano: number) => Number.isInteger(ano) && ano >= ANO_MIN && ano <= ANO_MAX;

// Em UTC não há horário de verão: todo dia tem 24 h.
const DIA_MS = 86_400_000;

const FIXOS: readonly { mes: number; dia: number; nome: string; desde?: number }[] = [
  { mes: 1, dia: 1, nome: "Confraternização Universal" },
  { mes: 4, dia: 21, nome: "Tiradentes" },
  { mes: 5, dia: 1, nome: "Dia do Trabalho" },
  { mes: 9, dia: 7, nome: "Independência do Brasil" },
  { mes: 10, dia: 12, nome: "Nossa Senhora Aparecida" },
  { mes: 11, dia: 2, nome: "Finados" },
  { mes: 11, dia: 15, nome: "Proclamação da República" },
  // Só é nacional desde a Lei 14.759/2023; antes era feriado de alguns estados e municípios.
  { mes: 11, dia: 20, nome: "Dia da Consciência Negra", desde: 2024 },
  { mes: 12, dia: 25, nome: "Natal" },
];

// `dias` é o deslocamento em relação à Páscoa. O Carnaval é a terça-feira.
const MOVEIS: readonly { dias: number; nome: string; tipo: Feriado["tipo"] }[] = [
  { dias: -47, nome: "Carnaval", tipo: "facultativo" },
  { dias: -2, nome: "Sexta-feira Santa", tipo: "feriado" },
  { dias: 60, nome: "Corpus Christi", tipo: "facultativo" },
];

function formata(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function pascoaMs(ano: number): number {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return Date.UTC(ano, Math.floor(n / 31) - 1, (n % 31) + 1);
}

/** Domingo de Páscoa do ano, em `AAAA-MM-DD`. Lança `RangeError` fora de 1583–9999. */
export function pascoa(ano: number): string {
  if (!anoSuportado(ano)) throw new RangeError(`Ano fora do calendário gregoriano suportado: ${ano}`);
  return formata(pascoaMs(ano));
}

/** Feriados nacionais do ano em ordem de data — `[]` fora de 1583–9999. */
export function feriadosDoAno(ano: number): Feriado[] {
  if (!anoSuportado(ano)) return [];
  const p = pascoaMs(ano);
  const fixos = FIXOS.filter((f) => !f.desde || ano >= f.desde).map(
    (f): Feriado => ({ dia: formata(Date.UTC(ano, f.mes - 1, f.dia)), nome: f.nome, tipo: "feriado" }),
  );
  const moveis = MOVEIS.map((m): Feriado => ({ dia: formata(p + m.dias * DIA_MS), nome: m.nome, tipo: m.tipo }));
  return [...fixos, ...moveis].sort((a, b) => a.dia.localeCompare(b.dia));
}

/**
 * O feriado que cai em `dia` (`AAAA-MM-DD`), ou `undefined`. Data mal formada também dá
 * `undefined`. Se dois caem no mesmo dia (em 2000 a Sexta-feira Santa foi no Tiradentes),
 * devolve o primeiro da lista do ano.
 */
export function feriadoDoDia(dia: string): Feriado | undefined {
  return feriadosDoAno(Number(dia.slice(0, 4))).find((f) => f.dia === dia);
}
