import type { Modulo } from "../tipos";
import CadastroPaciente from "./CadastroPaciente";
import FichaPaciente from "./FichaPaciente";
import ListaPacientes from "./ListaPacientes";

export const modulo: Modulo = {
  chave: "pacientes",
  rotas: [
    { path: "/pacientes", Component: ListaPacientes },
    { path: "/pacientes/novo", Component: CadastroPaciente },
    { path: "/pacientes/:id", Component: FichaPaciente },
  ],
  coluna: { grupo: "consultorio", ordem: 20, rotulo: "Pacientes", icone: "users", caminho: "/pacientes", barraCelular: true },
};
