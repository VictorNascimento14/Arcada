import type { Modulo } from "../tipos";
import ListaProcedimentos from "./ListaProcedimentos";

export const modulo: Modulo = {
  chave: "procedimentos",
  rotas: [{ path: "/procedimentos", Component: ListaProcedimentos }],
  coluna: { grupo: "cadastros", ordem: 10, rotulo: "Procedimentos", icone: "list", caminho: "/procedimentos" },
};
