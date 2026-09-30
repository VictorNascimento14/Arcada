import { Outlet, type RouteObject } from "react-router-dom";

import { RailLayout } from "@/ui";
import { NAVEGACAO } from "./modulos";
import BuscaGlobal from "./modulos/sistema/BuscaGlobal";
import { CONTA } from "./navegacao";
import ErroInesperado from "./sistema/ErroInesperado";
import NaoEncontrada from "./sistema/NaoEncontrada";

/**
 * A árvore de rotas, separada do roteador para o teste montá-la em memória.
 *
 * A raiz sem caminho dá a TODAS as rotas o mesmo
 * `errorElement` e monta a busca global (Ctrl+K). Toda tela com coluna é filha do `RailLayout`, que monta a
 * coluna UMA vez; as telas de sistema ficam fora dela — o erro pode ser
 * justamente da casca.
 */
export const ROTAS: RouteObject[] = [
  {
    errorElement: <ErroInesperado />,
    // A busca global (Ctrl+K / ⌘K) mora aqui, uma vez, dentro do roteador (ela navega para a ficha).
    element: (
      <>
        <BuscaGlobal />
        <Outlet />
      </>
    ),
    children: [
      {
        element: (
          <RailLayout
            grupos={NAVEGACAO.grupos}
            conta={CONTA}
            barraCelular={NAVEGACAO.barraCelular.length > 0 ? NAVEGACAO.barraCelular : undefined}
          />
        ),
        children: NAVEGACAO.rotas,
      },
      { path: "*", element: <NaoEncontrada /> },
    ],
  },
];
