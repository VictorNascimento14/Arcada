import type { Modulo } from "../tipos";
import AbaOdontograma from "./AbaOdontograma";

// Só a aba da ficha do paciente: o odontograma não tem página própria.
export const modulo: Modulo = {
  chave: "odontograma",
  rotas: [],
  abaPaciente: { ordem: 20, rotulo: "Odontograma", Componente: AbaOdontograma },
};
