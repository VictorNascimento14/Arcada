import type { Modulo } from "../tipos";
import AbaPeriodonto from "./AbaPeriodonto";

// Só a aba da ficha do paciente: o periodontograma não tem página própria.
export const modulo: Modulo = {
  chave: "periodontograma",
  rotas: [],
  abaPaciente: { ordem: 30, rotulo: "Periodonto", Componente: AbaPeriodonto },
};
