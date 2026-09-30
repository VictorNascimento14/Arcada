import type { Modulo } from "../tipos";
import PaginaDocumentos from "./PaginaDocumentos";

export const modulo: Modulo = {
  chave: "documentos",
  rotas: [{ path: "/documentos", Component: PaginaDocumentos }],
  coluna: { grupo: "gestao", ordem: 30, rotulo: "Documentos", icone: "file", caminho: "/documentos" },
};
