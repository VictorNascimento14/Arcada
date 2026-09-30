import type { DataHoraISO } from "./datas";

/** `faltou` é o paciente que não veio. As transições permitidas entre as situações são do item 8.6. */
export type SituacaoConsulta = "agendada" | "confirmada" | "em-atendimento" | "concluida" | "faltou" | "cancelada";

/** Um horário marcado na agenda: um paciente, um profissional e uma cadeira. */
export type Consulta = {
  id: string;
  pacienteId: string;
  profissionalId: string;
  cadeiraId: string;
  inicio: DataHoraISO;
  /** Em minutos. O fim é `inicio` mais a duração e não se guarda. */
  duracaoMin: number;
  /** Procedimento previsto, do catálogo (`procedimentos`). Opcional: uma avaliação ou um retorno pode não ter um. */
  procedimentoId?: string;
  situacao: SituacaoConsulta;
};
