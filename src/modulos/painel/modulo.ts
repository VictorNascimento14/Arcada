import type { Modulo } from "../tipos";
import Painel from "./Painel";

export const modulo: Modulo = {
  chave: "painel",
  rotas: [{ path: "/", Component: Painel }],
  coluna: { grupo: "consultorio", ordem: 0, rotulo: "Painel", icone: "grid", caminho: "/", exato: true, barraCelular: true },
};
