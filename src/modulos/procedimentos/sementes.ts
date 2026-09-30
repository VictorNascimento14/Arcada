import { procedimentos } from "@/dados/colecoes";
import type { Semeador } from "@/dados/sementes";

import { CATALOGO } from "./catalogo";

/** Planta o catálogo padrão só numa coleção vazia: a tabela que a clínica já editou nunca é reposta. */
export const semeador: Semeador = {
  chave: "procedimentos",
  versao: 1,
  semear: () => {
    if (procedimentos.listar().length === 0) procedimentos.substituirTudo(CATALOGO);
  },
};
