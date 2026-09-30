// As marcas do odontograma de cada paciente. Dado que só este módulo usa, por isso mora aqui e não em
// `src/dados/colecoes.ts`. A tela lê por `useMarcas` e escreve por `alternarMarcaDoPaciente`; nunca toca o
// armazenamento.

import { criarColecao } from "@/dados/colecao";
import { useColecao } from "@/dados/useColecao";

import { alternarMarca, conferirMarca, type Marca } from "./marcas";

/** Um odontograma por paciente: o `id` é o do paciente. */
export type OdontogramaDoPaciente = { id: string; marcas: Marca[] };

export const odontogramas = criarColecao<OdontogramaDoPaciente>("odontogramas");

// Sempre o mesmo array: um `[]` novo a cada render faria a tela achar que os dados mudaram.
const SEM_MARCAS: readonly Marca[] = [];

/** As marcas do paciente, reativas; vazio enquanto nada foi marcado. */
export function useMarcas(pacienteId: string): readonly Marca[] {
  return useColecao(odontogramas).find((o) => o.id === pacienteId)?.marcas ?? SEM_MARCAS;
}

/**
 * Liga ou desliga a condição no dente ou na face e guarda. Devolve `true` se ficou aplicada e `false` se foi
 * removida. Lança `RangeError`, sem gravar, se a marca não faz sentido (ver `conferirMarca`).
 */
export function alternarMarcaDoPaciente(pacienteId: string, marca: Marca): boolean {
  conferirMarca(marca);
  const { marcas, aplicada } = alternarMarca(odontogramas.obter(pacienteId)?.marcas ?? [], marca);
  odontogramas.salvar({ id: pacienteId, marcas });
  return aplicada;
}
