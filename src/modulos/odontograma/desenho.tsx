// O que se desenha de um dente, num quadro de 40 por 40: a forma de cada face, a marca de uma condição numa face
// e o símbolo de uma condição do dente inteiro. A cor vem da classe `text-*` da condição (`condicoes.ts`), posta
// no grupo da marca: o desenho usa `currentColor`. Como a cor sozinha não basta (quatro condições caem no eixo
// vermelho–verde), cada condição tem também um símbolo só seu — o teste garante que nenhum se repete.

import type { ReactNode } from "react";

import { CONDICAO_POR_ID, ehCondicaoDeFace, type CondicaoDeDente, type CondicaoDeFace, type CondicaoId } from "./condicoes";
import { POSICOES, type Posicao } from "./disposicao";

// Um quadrado de 36 com um quadrado central de 16: o centro é a face de cima do dente e os quatro trapézios em
// volta são as outras quatro.
const FORMAS: Record<Posicao, string> = {
  cima: "M2 2H38L28 12H12Z",
  esquerda: "M2 2V38L12 28V12Z",
  centro: "M12 12H28V28H12Z",
  direita: "M38 2V38L28 28V12Z",
  baixo: "M2 38H38L28 28H12Z",
};

const CENTROS: Record<Posicao, readonly [x: number, y: number]> = {
  cima: [20, 7],
  esquerda: [7, 20],
  centro: [20, 20],
  direita: [33, 20],
  baixo: [20, 33],
};

/** A forma de uma face, sem condição. */
export function FormaDaFace({ posicao }: { posicao: Posicao }) {
  return (
    <path
      d={FORMAS[posicao]}
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="fill-foreground-950/[0.04] stroke-foreground-500 transition-colors group-hover:fill-primary-500/25"
    />
  );
}

// Uma condição de face é um sinal pequeno no meio dela, centrado na origem: círculo cheio, quadrado cheio ou anel.
const GLIFOS_DE_FACE: Record<CondicaoDeFace, ReactNode> = {
  carie: <circle r="3.4" className="fill-current" />,
  restauracao: <rect x="-3.1" y="-3.1" width="6.2" height="6.2" className="fill-current" />,
  selante: <circle r="2.8" strokeWidth="1.7" className="fill-none stroke-current" />,
};

/** A condição de uma face: a face tingida na cor dela e o sinal no meio (maior na face do centro). */
export function MarcaDaFace({ condicao, posicao, escala = posicao === "centro" ? 1.4 : 1 }: { condicao: CondicaoDeFace; posicao: Posicao; escala?: number }) {
  const [x, y] = CENTROS[posicao];
  return (
    <g data-simbolo={condicao} pointerEvents="none" className={CONDICAO_POR_ID[condicao].cor}>
      <path d={FORMAS[posicao]} fillOpacity="0.3" className="fill-current" />
      <g transform={`translate(${x} ${y}) scale(${escala})`}>{GLIFOS_DE_FACE[condicao]}</g>
    </g>
  );
}

// Uma condição do dente inteiro é um traço sobre o quadrado todo: fratura em zigue-zague, extração em X, ausente
// em contorno tracejado com um traço no meio, canal numa linha, coroa num anel em volta e implante numa haste
// com rosca.
const SIMBOLOS_DE_DENTE: Record<CondicaoDeDente, ReactNode> = {
  fratura: <path d="M8 5 L19 15 L12 22 L24 30 L32 36" />,
  extracaoIndicada: <path d="M6 6 L34 34 M34 6 L6 34" />,
  ausente: (
    <>
      <path d="M3 3 H37 V37 H3 Z" strokeDasharray="4 3" />
      <path d="M9 20 H31" />
    </>
  ),
  tratamentoDeCanal: <path d="M20 5 V35" />,
  coroa: <circle cx="20" cy="20" r="17.5" />,
  implante: <path d="M20 5 V35 M13 12 H27 M13 20 H27 M13 28 H27" />,
};

/** A condição do dente inteiro, desenhada por cima de todas as faces (sem pegar o clique delas). */
export function MarcaDoDente({ condicao }: { condicao: CondicaoDeDente }) {
  return (
    <g
      data-simbolo={condicao}
      pointerEvents="none"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`fill-none stroke-current ${CONDICAO_POR_ID[condicao].cor}`}
    >
      {SIMBOLOS_DE_DENTE[condicao]}
    </g>
  );
}

/** O ícone da condição na barra e na legenda: o dente com a marca que ela faz (a de face, na face do centro). */
export function IconeDaCondicao({ id }: { id: CondicaoId }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="h-7 w-7 shrink-0">
      {POSICOES.map((posicao) => (
        <FormaDaFace key={posicao} posicao={posicao} />
      ))}
      {ehCondicaoDeFace(id) ? <MarcaDaFace condicao={id} posicao="centro" escala={2.4} /> : <MarcaDoDente condicao={id} />}
    </svg>
  );
}
