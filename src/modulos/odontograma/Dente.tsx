import type { KeyboardEvent } from "react";

import { nomeDente, nomeFace } from "@/dominio/fdi";
import type { Face, NumeroDente } from "@/dominio/odontologia";

import { CONDICAO_POR_ID, type CondicaoId } from "./condicoes";
import { FormaDaFace, MarcaDaFace, MarcaDoDente } from "./desenho";
import { disposicaoDasFaces, POSICOES } from "./disposicao";
import type { Marca, MarcaDeDente, MarcaDeFace } from "./marcas";

const rotulo = (id: CondicaoId) => CONDICAO_POR_ID[id].rotulo.toLowerCase();
const NUMERO = "rounded px-1.5 text-xs font-medium tabular-nums text-foreground-700";

type Props = {
  numero: NumeroDente;
  /** As marcas do odontograma; o dente mostra só as dele. */
  marcas?: readonly Marca[];
  /** Chamada quando uma face é ativada: clique, Enter ou Espaço. Sem ela as faces só mostram. */
  onFace?: (face: Face) => void;
  /** Chamada ao clicar no número, para marcar o dente inteiro. Sem ela o número é só um rótulo. */
  onNumero?: () => void;
};

/**
 * Um dente desenhado com as cinco faces, o número FDI acima e as condições marcadas. Onde cada face fica está em
 * `disposicao.ts` e como se desenha, em `desenho.tsx`; aqui estão a estrutura e o que cada parte faz. Cada face é
 * um botão do teclado (`Tab` chega nela, `Enter` e `Espaço` a ativam) com o nome por escrito, condição incluída.
 * Ocupa a largura do contêiner: quem o usa dá o tamanho.
 */
export default function Dente({ numero, marcas = [], onFace, onNumero }: Props) {
  const faces = disposicaoDasFaces(numero);
  const suas = marcas.filter((m) => m.dente === numero);
  const doDente = suas.filter((m): m is MarcaDeDente => !("face" in m));
  const daFace = (face: Face) => suas.find((m): m is MarcaDeFace => "face" in m && m.face === face);

  function aoTeclar(e: KeyboardEvent<SVGGElement>, face: Face) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); // o Espaço não rola a página
    if (!e.repeat) onFace?.(face); // a tecla mantida não repete a ação
  }

  const nomeDoDente = `Dente ${numero}, ${nomeDente(numero)}`;

  return (
    <div className="flex w-full flex-col items-center gap-1">
      {onNumero ? (
        <button
          type="button"
          aria-label={`dente ${numero} inteiro`}
          onClick={onNumero}
          className={`press cursor-pointer hover:bg-primary-900/[0.07] ${NUMERO}`}
        >
          {numero}
        </button>
      ) : (
        <span aria-hidden="true" className={NUMERO}>
          {numero}
        </span>
      )}
      <svg
        viewBox="0 0 40 40"
        role="group"
        aria-label={doDente.length ? `${nomeDoDente}. Condições do dente: ${doDente.map((m) => rotulo(m.condicao)).join(", ")}` : nomeDoDente}
        className="aspect-square w-full"
      >
        {POSICOES.map((posicao) => {
          const face = faces[posicao];
          const marca = daFace(face);
          return (
            <g
              key={posicao}
              role="button"
              tabIndex={0}
              aria-disabled={onFace ? undefined : true}
              aria-label={`face ${nomeFace(face)} do dente ${numero}${marca ? `: ${rotulo(marca.condicao)}` : ""}`}
              data-posicao={posicao}
              onClick={() => onFace?.(face)}
              onKeyDown={(e) => aoTeclar(e, face)}
              className={onFace ? "group cursor-pointer" : undefined}
            >
              <FormaDaFace posicao={posicao} />
              {marca && <MarcaDaFace condicao={marca.condicao} posicao={posicao} />}
            </g>
          );
        })}
        {doDente.map((m) => (
          <MarcaDoDente key={m.condicao} condicao={m.condicao} />
        ))}
      </svg>
    </div>
  );
}
