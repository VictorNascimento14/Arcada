import { useId } from "react";

import { CONDICOES, type EscopoCondicao } from "./condicoes";

const GRUPOS: { escopo: EscopoCondicao; titulo: string }[] = [
  { escopo: "face", titulo: "Por face" },
  { escopo: "dente", titulo: "Dente inteiro" },
];

/**
 * A legenda das condições do odontograma, em dois grupos: as que se marcam numa face e as que valem no dente
 * inteiro. O quadrado colorido é só enfeite (`aria-hidden`) — o nome está sempre escrito ao lado. A cor
 * chega pronta de `condicoes.ts`: a classe `text-*` da condição vira o fundo por `bg-current`.
 */
export default function Legenda() {
  const id = useId();

  return (
    <div role="group" aria-label="Legenda do odontograma" className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {GRUPOS.map(({ escopo, titulo }) => (
        <div key={escopo}>
          <p id={`${id}-${escopo}`} className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground-500">
            {titulo}
          </p>
          <ul role="list" aria-labelledby={`${id}-${escopo}`} className="mt-2 grid gap-1.5">
            {CONDICOES.filter((c) => c.escopo === escopo).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-foreground-700">
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded bg-current ring-1 ring-inset ring-foreground-950/15 ${c.cor}`}
                />
                {c.rotulo}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
