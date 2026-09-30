/**
 * Os planos em aberto no painel, em dois grupos, cada um com a contagem e o valor: os orçamentos (propostos, à espera
 * da decisão do paciente) e os tratamentos (aprovados e em andamento). O que é "em aberto" quem diz é `planosEmAberto`,
 * do módulo de tratamentos — a mesma regra da lista `/tratamentos`: concluído e recusado ficam de fora.
 */
import { somarCentavos, type Centavos, type Paciente, type PlanoTratamento } from "@/dominio";
import { planosEmAberto } from "@/modulos/tratamentos/emAberto";
import { total } from "@/modulos/tratamentos/plano";

export type Resumo = { quantidade: number; valor: Centavos };

const resumir = (planos: readonly PlanoTratamento[]): Resumo => ({
  quantidade: planos.length,
  valor: somarCentavos(...planos.map((plano) => total(plano))),
});

/**
 * O valor de um grupo é a soma dos `total` dos planos, já com o desconto (o que o paciente paga), em centavos. Os dois
 * grupos repartem os planos em aberto: o que não é proposto é aprovado ou está em andamento.
 */
export function resumoEmAberto(
  planos: readonly PlanoTratamento[],
  pacientes: readonly Paciente[],
): { orcamentos: Resumo; tratamentos: Resumo } {
  const abertos = planosEmAberto(planos, pacientes).map(({ plano }) => plano);
  return {
    orcamentos: resumir(abertos.filter((p) => p.situacao === "proposto")),
    tratamentos: resumir(abertos.filter((p) => p.situacao !== "proposto")),
  };
}
