import type { Modulo } from "../tipos";
import AbaTratamentos from "./AbaTratamentos";
import PlanosEmAberto from "./PlanosEmAberto";
import TelaDoPlano from "./TelaDoPlano";

export const modulo: Modulo = {
  chave: "tratamentos",
  rotas: [
    { path: "/tratamentos", Component: PlanosEmAberto },
    { path: "/planos/:planoId", Component: TelaDoPlano },
  ],
  coluna: { grupo: "gestao", ordem: 10, rotulo: "Tratamentos", icone: "receipt", caminho: "/tratamentos" },
  abaPaciente: { ordem: 40, rotulo: "Tratamentos", Componente: AbaTratamentos },
};
