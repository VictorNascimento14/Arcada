import type { Modulo } from "../tipos";
import AbaFinanceiro from "./AbaFinanceiro";
import PaginaFinanceiro from "./PaginaFinanceiro";

export const modulo: Modulo = {
  chave: "financeiro",
  rotas: [{ path: "/financeiro", Component: PaginaFinanceiro }],
  coluna: { grupo: "gestao", ordem: 20, rotulo: "Financeiro", icone: "coin", caminho: "/financeiro", barraCelular: true },
  abaPaciente: { ordem: 50, rotulo: "Financeiro", Componente: AbaFinanceiro },
};
