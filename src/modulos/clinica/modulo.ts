import type { Modulo } from "../tipos";
import PaginaClinica from "./PaginaClinica";

export const modulo: Modulo = {
  chave: "clinica",
  rotas: [{ path: "/clinica", Component: PaginaClinica }],
  coluna: { grupo: "cadastros", ordem: 20, rotulo: "Clínica", icone: "building", caminho: "/clinica" },
};
