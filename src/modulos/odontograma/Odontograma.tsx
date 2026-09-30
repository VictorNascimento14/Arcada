import { DENTES_PERMANENTES } from "@/dominio/fdi";
import type { NumeroDente } from "@/dominio/odontologia";

import Dente from "./Dente";

/**
 * Uma arcada numa linha só: a metade do lado direito do paciente, a linha média e a metade do esquerdo. As duas
 * metades têm a mesma largura, então a linha média cai sempre no meio, qualquer que seja o número de dentes.
 * Os dentes vêm na ordem em que se desenham (`DENTES_PERMANENTES`): o lado direito do paciente à esquerda de
 * quem olha.
 */
function Arcada({ nome, dentes }: { nome: string; dentes: readonly NumeroDente[] }) {
  const meio = dentes.length / 2;
  const desenho = (n: NumeroDente) => (
    <div key={n} className="w-[var(--dente)] shrink-0">
      <Dente numero={n} />
    </div>
  );

  return (
    <div role="group" aria-label={nome} className="flex">
      <div className="flex flex-1 justify-end">{dentes.slice(0, meio).map(desenho)}</div>
      <div role="separator" aria-orientation="vertical" aria-label="Linha média" className="w-px self-stretch bg-foreground-950/25" />
      <div className="flex flex-1 justify-start">{dentes.slice(meio).map(desenho)}</div>
    </div>
  );
}

/**
 * O odontograma: a arcada superior e a inferior, com os dentes permanentes. O tamanho do dente é fixo
 * (`--dente`, maior a partir do `md`); onde a tela não comporta as 16 colunas, as arcadas rolam na horizontal em
 * vez de encolher os dentes até não dar para tocar em cada face.
 */
export default function Odontograma() {
  return (
    <div className="overflow-x-auto p-2">
      <div className="mx-auto flex w-max flex-col gap-8 [--dente:2.75rem] md:[--dente:3.5rem]">
        <Arcada nome="Arcada superior" dentes={DENTES_PERMANENTES.superior} />
        <Arcada nome="Arcada inferior" dentes={DENTES_PERMANENTES.inferior} />
      </div>
    </div>
  );
}
