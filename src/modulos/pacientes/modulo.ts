import type { Modulo } from "../tipos";
import ListaPacientes from "./ListaPacientes";

export const modulo: Modulo = {
  chave: "pacientes",
  rotas: [{ path: "/pacientes", Component: ListaPacientes }],
  coluna: { grupo: "consultorio", ordem: 20, rotulo: "Pacientes", icone: "users", caminho: "/pacientes", barraCelular: true },
};
