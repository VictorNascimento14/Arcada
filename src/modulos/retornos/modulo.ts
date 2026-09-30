import type { Modulo } from "../tipos";
import PaginaRetornos from "./PaginaRetornos";

export const modulo: Modulo = {
  chave: "retornos",
  rotas: [{ path: "/retornos", Component: PaginaRetornos }],
  coluna: { grupo: "consultorio", ordem: 30, rotulo: "Retornos", icone: "refresh", caminho: "/retornos" },
};
