import { useId, useState } from "react";

import { DENTES_DECIDUOS, DENTES_PERMANENTES } from "@/dominio/fdi";
import type { NumeroDente } from "@/dominio/odontologia";

import Dente from "./Dente";

/**
 * Uma arcada numa linha só: a metade do lado direito do paciente, a linha média e a metade do esquerdo. As duas
 * metades têm a mesma largura, então a linha média cai sempre no meio, qualquer que seja o número de dentes
 * (16 nos permanentes, 10 nos decíduos). Os dentes vêm na ordem em que se desenham (`DENTES_PERMANENTES` e
 * `DENTES_DECIDUOS`): o lado direito do paciente à esquerda de quem olha.
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

type Denticao = "permanente" | "decidua" | "mista";

const DENTICOES: readonly { id: Denticao; rotulo: string }[] = [
  { id: "permanente", rotulo: "Permanente" },
  { id: "decidua", rotulo: "Decídua" },
  { id: "mista", rotulo: "Mista" },
];

const DENTES = { permanente: DENTES_PERMANENTES, decidua: DENTES_DECIDUOS };

// De cima para baixo, o que cada arcada mostra. Na dentição mista as duas de leite ficam juntas, no meio, junto
// ao plano de mordida, e as permanentes nas pontas.
const ARCADAS = [
  { arcada: "superior", ordem: ["permanente", "decidua"] },
  { arcada: "inferior", ordem: ["decidua", "permanente"] },
] as const;

/** Quem escolhe a dentição é o profissional: o app não decide qual delas o paciente tem. */
function SeletorDenticao({ escolhida, aoEscolher }: { escolhida: Denticao; aoEscolher: (d: Denticao) => void }) {
  const grupo = useId();

  return (
    <fieldset>
      <legend className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground-500">Dentição</legend>
      <div className="mt-2 flex flex-wrap gap-1">
        {DENTICOES.map(({ id, rotulo }) => (
          <label key={id} className="relative cursor-pointer">
            <input type="radio" name={grupo} value={id} checked={escolhida === id} onChange={() => aoEscolher(id)} className="peer sr-only" />
            <span className="press block rounded-full px-4 py-2 text-sm font-semibold text-foreground-600 outline outline-2 outline-offset-2 outline-transparent transition-colors hover:bg-primary-900/[0.07] hover:text-primary-900 peer-checked:bg-primary-900 peer-checked:text-primary-50 peer-checked:shadow-nav-active peer-focus-visible:outline-primary-600">
              {rotulo}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * O odontograma: as arcadas superior e inferior da dentição escolhida — permanente (a que abre), decídua ou as
 * duas (mista). O tamanho do dente é fixo (`--dente`, maior a partir do `md`); onde a tela não comporta as 16
 * colunas, as arcadas rolam na horizontal em vez de encolher os dentes até não dar para tocar em cada face.
 */
export default function Odontograma() {
  const [denticao, setDenticao] = useState<Denticao>("permanente");

  return (
    <div className="flex flex-col gap-4">
      <SeletorDenticao escolhida={denticao} aoEscolher={setDenticao} />
      <div className="overflow-x-auto p-2">
        <div className="mx-auto flex w-max flex-col gap-8 [--dente:2.75rem] md:[--dente:3.5rem]">
          {ARCADAS.map(({ arcada, ordem }) => (
            <div key={arcada} className="flex flex-col gap-3">
              {ordem
                .filter((tipo) => denticao === "mista" || denticao === tipo)
                .map((tipo) => (
                  <Arcada key={tipo} nome={`Arcada ${arcada}${tipo === "decidua" ? " decídua" : ""}`} dentes={DENTES[tipo][arcada]} />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
