import type { Conta, GrupoNav } from "@/ui";

/**
 * A navegação do app — a única coisa que a coluna lateral, a gaveta do celular
 * e a barra de baixo leem. Mexer aqui muda as três de uma vez.
 */
export const GRUPOS: GrupoNav[] = [
  {
    chave: "consultorio",
    rotulo: "Consultório",
    itens: [
      // `exact` porque "/" é prefixo de toda rota.
      { key: "painel", label: "Painel", path: "/", icon: "grid", exact: true },
    ],
  },
];

/** Quem está na sessão. A v1 não tem login: é a profissional de demonstração. */
export const CONTA: Conta = {
  nome: "Dra. Exemplo",
  papel: "Cirurgiã-dentista",
};
