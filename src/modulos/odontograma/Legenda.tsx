import { useId } from "react";

import { CONDICOES, GRUPOS_DE_ESCOPO } from "./condicoes";
import { IconeDaCondicao } from "./desenho";

/**
 * A legenda das condições do odontograma, em dois grupos: as que se marcam numa face e as que valem no dente
 * inteiro. Cada uma mostra o símbolo que tem no desenho — a cor sozinha não basta — e o nome sempre escrito ao
 * lado. O ícone é só enfeite (`aria-hidden`); a cor chega pronta de `condicoes.ts`.
 */
export default function Legenda() {
  const id = useId();

  return (
    <div role="group" aria-label="Legenda do odontograma" className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {GRUPOS_DE_ESCOPO.map(({ escopo, titulo }) => (
        <div key={escopo}>
          <p id={`${id}-${escopo}`} className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground-500">
            {titulo}
          </p>
          <ul role="list" aria-labelledby={`${id}-${escopo}`} className="mt-2 grid gap-1.5">
            {CONDICOES.filter((c) => c.escopo === escopo).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-foreground-700">
                <IconeDaCondicao id={c.id} />
                {c.rotulo}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
