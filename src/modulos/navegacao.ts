import type { GrupoNav } from "@/ui";

import { GRUPOS_COLUNA, type GrupoColuna, type Modulo } from "./tipos";

export type AbaPaciente = NonNullable<Modulo["abaPaciente"]> & { chave: string };

/** Transforma a lista de módulos no que a casca e a ficha do paciente leem. */
export function montarNavegacao(modulos: Modulo[]) {
  const porOrdem = (a: { ordem: number; chave: string }, b: { ordem: number; chave: string }) =>
    a.ordem - b.ordem || a.chave.localeCompare(b.chave);

  const naColuna = modulos
    .flatMap((m) => (m.coluna ? [{ ...m.coluna, chave: m.chave }] : []))
    .sort(porOrdem);

  const grupos: GrupoNav[] = (Object.keys(GRUPOS_COLUNA) as GrupoColuna[])
    .map((grupo) => ({
      chave: grupo,
      rotulo: GRUPOS_COLUNA[grupo],
      itens: naColuna
        .filter((c) => c.grupo === grupo)
        .map((c) => ({ key: c.chave, label: c.rotulo, path: c.caminho, icon: c.icone, exact: c.exato })),
    }))
    .filter((g) => g.itens.length > 0);

  const abasPaciente: AbaPaciente[] = modulos
    .flatMap((m) => (m.abaPaciente ? [{ ...m.abaPaciente, chave: m.chave }] : []))
    .sort(porOrdem);

  return {
    rotas: modulos.flatMap((m) => m.rotas),
    grupos,
    barraCelular: naColuna.filter((c) => c.barraCelular).map((c) => c.chave),
    abasPaciente,
  };
}
