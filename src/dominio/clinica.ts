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
  /** Convênios que a clínica aceita, pelo nome, em ordem alfabética e sem repetir (a regra é `modulos/clinica/convenios.ts`). Sem o campo, nenhum foi cadastrado. */
  convenios?: string[];
};

/** Quem atende. */
export type Profissional = {
  id: string;
  nome: string;
  /** Registro no CRO com a sigla do estado (`CRO-SP 00000`); o formato se confere em `modulos/clinica/cro.ts`. */
  cro: string;
  /** Área de atuação, em texto livre (ex.: `Endodontia`). */
  especialidade?: string;
  /** Cor do profissional na agenda, em CSS (ex.: `#0f766e`). Vai num `style`: classe do Tailwind montada em runtime não existe. */
  cor: string;
  /** Inativo continua no histórico, mas some das escolhas. Sem o campo conta como ativo: use `profissionalAtivo`. */
  ativo?: boolean;
};

/** Ativo é o padrão: o profissional sem o campo (semente, dado gravado antes dele existir) está ativo. */
export const profissionalAtivo = (p: Pick<Profissional, "ativo">): boolean => p.ativo !== false;

/** Posto de atendimento — a cadeira com o seu equipamento. A agenda é organizada por ela. */
export type Cadeira = {
  id: string;
  nome: string;
  /** Inativa continua no histórico, mas some das escolhas. Sem o campo conta como ativa: use `cadeiraAtiva`. */
  ativa?: boolean;
};

/** Ativa é o padrão: a cadeira sem o campo (semente, dado gravado antes dele existir) está ativa. */
export const cadeiraAtiva = (c: Pick<Cadeira, "ativa">): boolean => c.ativa !== false;
