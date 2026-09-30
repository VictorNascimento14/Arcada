import type { HoraISO } from "./datas";

/** Dia da semana como em `Date.getDay()`: 0 é domingo e 6, sábado. */
export type DiaDaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Trecho contínuo de atendimento dentro de um dia, em horário local (ex.: `08:00` a `12:00`). */
export type FaixaHoraria = { inicio: HoraISO; fim: HoraISO };

/**
 * Quando a clínica atende, por dia da semana. Os sete dias estão sempre presentes: lista vazia é dia
 * fechado, e duas faixas dão o intervalo de almoço. A agenda consulta direto por `Date.getDay()`.
 */
export type Expediente = Record<DiaDaSemana, FaixaHoraria[]>;

/** A clínica. A v1 tem uma só. */
export type Clinica = {
  id: string;
  nome: string;
  /** Contato e endereço saem no cabeçalho dos documentos impressos. Todos opcionais. */
  telefone?: string;
  endereco?: string;
  cidade?: string;
  /** Sigla da unidade da federação (ex.: `SP`). */
  uf?: string;
  expediente: Expediente;
};

/** Quem atende. */
export type Profissional = {
  id: string;
  nome: string;
  /** Registro no CRO com a sigla do estado (`CRO-UF 00000` no exemplo). Validação: item 5.6. */
  cro: string;
  /** Cor do profissional na agenda, em CSS (ex.: `#0f766e`). Vai num `style`: classe do Tailwind montada em runtime não existe. */
  cor: string;
};

/** Posto de atendimento — a cadeira com o seu equipamento. A agenda é organizada por ela. */
export type Cadeira = {
  id: string;
  nome: string;
};
