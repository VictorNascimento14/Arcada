import type { KeyboardEvent } from "react";

import { nomeDente, nomeFace } from "@/dominio/fdi";
import type { Face, NumeroDente } from "@/dominio/odontologia";

import { disposicaoDasFaces, POSICOES, type Posicao } from "./disposicao";

// O desenho cabe numa caixa de 40 por 40: um quadrado de 36 com um quadrado central de 16. O centro é a face de
// cima do dente e os quatro trapézios em volta são as outras quatro, cada um deles um lado do quadrado.
const FORMAS: Record<Posicao, string> = {
  cima: "M2 2H38L28 12H12Z",
  esquerda: "M2 2V38L12 28V12Z",
  centro: "M12 12H28V28H12Z",
  direita: "M38 2V38L28 28V12Z",
  baixo: "M2 38H38L28 28H12Z",
};

type Props = {
  numero: NumeroDente;
  /** Chamada quando uma face é ativada: clique, Enter ou Espaço. */
  onFace?: (face: Face) => void;
};

/**
 * Um dente desenhado com as cinco faces, o número FDI acima. Onde cada face fica está em `disposicao.ts`; aqui
 * estão o desenho e o que cada face faz. Cada face é um botão do teclado (`Tab` chega nela, `Enter` e `Espaço`
 * a ativam) e tem o nome dela por escrito. Ocupa a largura do contêiner: quem o usa dá o tamanho.
 */
export default function Dente({ numero, onFace }: Props) {
  const faces = disposicaoDasFaces(numero);

  function aoTeclar(e: KeyboardEvent<SVGGElement>, face: Face) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); // o Espaço não rola a página
    if (!e.repeat) onFace?.(face); // a tecla mantida não repete a ação
  }

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <span aria-hidden="true" className="text-xs font-medium tabular-nums text-foreground-700">
        {numero}
      </span>
      <svg viewBox="0 0 40 40" role="group" aria-label={`Dente ${numero}, ${nomeDente(numero)}`} className="aspect-square w-full">
        {POSICOES.map((posicao) => {
          const face = faces[posicao];
          return (
            <g
              key={posicao}
              role="button"
              tabIndex={0}
              aria-label={`face ${nomeFace(face)} do dente ${numero}`}
              data-posicao={posicao}
              onClick={() => onFace?.(face)}
              onKeyDown={(e) => aoTeclar(e, face)}
              className={`group${onFace ? " cursor-pointer" : ""}`}
            >
              <path
                d={FORMAS[posicao]}
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="fill-foreground-950/[0.04] stroke-foreground-500 transition-colors group-hover:fill-primary-500/25"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
