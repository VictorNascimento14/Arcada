import type { DataISO } from "./datas";

/** Quem é atendido na clínica. Dado pessoal: em semente e em teste, só nome fictício (`Paciente Exemplo`). */
export type Paciente = {
  id: string;
  nome: string;
  nascimento: DataISO;
  telefone: string;
  /** Formato de guarda e validação: item 1.2. Nunca em semente. */
  cpf?: string;
  email?: string;
  /** Nome do convênio; ausente é paciente particular. */
  convenio?: string;
};
