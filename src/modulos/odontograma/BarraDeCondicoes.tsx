import { useId } from "react";

import { CONDICAO_POR_ID, CONDICOES, GRUPOS_DE_ESCOPO, type CondicaoId } from "./condicoes";
import { IconeDaCondicao } from "./desenho";

/**
 * A barra que escolhe a condição a marcar: as nove, em dois grupos (por face e dente inteiro), cada uma com o
 * símbolo que tem no desenho. São `radio` de verdade: uma só vale por vez e as setas trocam a escolha. A frase
 * de baixo diz onde clicar, que depende do escopo da condição: numa face ou no número do dente.
 */
export default function BarraDeCondicoes({ escolhida, aoEscolher }: { escolhida: CondicaoId; aoEscolher: (id: CondicaoId) => void }) {
  const id = useId();
  const { escopo, rotulo } = CONDICAO_POR_ID[escolhida];

  return (
    <fieldset aria-describedby={`${id}-dica`}>
      <legend className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground-500">Condição a marcar</legend>
      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
        {GRUPOS_DE_ESCOPO.map(({ escopo: grupo, titulo }) => (
          <div key={grupo}>
            <p className="text-xs font-medium text-foreground-600">{titulo}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CONDICOES.filter((c) => c.escopo === grupo).map((c) => (
                <label key={c.id} className="relative cursor-pointer">
                  <input type="radio" name={id} value={c.id} checked={escolhida === c.id} onChange={() => aoEscolher(c.id)} className="peer sr-only" />
                  <span className="press flex items-center gap-1.5 rounded-full border border-foreground-950/15 py-1 pl-1.5 pr-3 text-sm font-medium text-foreground-700 outline outline-2 outline-offset-2 outline-transparent transition-colors hover:bg-primary-900/[0.07] peer-checked:border-primary-700 peer-checked:bg-primary-900/10 peer-checked:ring-2 peer-checked:ring-primary-700 peer-focus-visible:outline-primary-600">
                    <IconeDaCondicao id={c.id} />
                    {c.rotulo}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p id={`${id}-dica`} className="mt-3 text-sm text-foreground-600">
        Clique {escopo === "face" ? "numa face do dente" : "no número do dente"} para marcar ou desmarcar {rotulo.toLowerCase()}.
      </p>
    </fieldset>
  );
}
