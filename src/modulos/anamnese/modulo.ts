import type { Modulo } from "../tipos";
import FormularioAnamnese from "./FormularioAnamnese";

// Só a aba da ficha do paciente: a anamnese não tem rota nem item na coluna.
export const modulo: Modulo = {
  chave: "anamnese",
  rotas: [],
  abaPaciente: { ordem: 10, rotulo: "Anamnese", Componente: FormularioAnamnese },
};
