import type { Modulo } from "../tipos";
import PaginaSistema from "./PaginaSistema";

export const modulo: Modulo = {
  chave: "sistema",
  rotas: [{ path: "/sistema", Component: PaginaSistema }],
  coluna: { grupo: "cadastros", ordem: 90, rotulo: "Sistema", icone: "shield-check", caminho: "/sistema" },
};
