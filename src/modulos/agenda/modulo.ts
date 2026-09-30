import type { Modulo } from "../tipos";
import PaginaAgenda from "./PaginaAgenda";

export const modulo: Modulo = {
  chave: "agenda",
  rotas: [{ path: "/agenda", Component: PaginaAgenda }],
  coluna: { grupo: "consultorio", ordem: 10, rotulo: "Agenda", icone: "calendar", caminho: "/agenda", barraCelular: true },
};
