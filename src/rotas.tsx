import type { RouteObject } from "react-router-dom";

import { RailLayout } from "@/ui";
import { NAVEGACAO } from "./modulos";
import { CONTA } from "./navegacao";
import ErroInesperado from "./sistema/ErroInesperado";
import NaoEncontrada from "./sistema/NaoEncontrada";

/**
 * A árvore de rotas, separada do roteador para o teste montá-la em memória.
 *
 * A raiz sem caminho existe só para dar a TODAS as rotas o mesmo
 * `errorElement`. Toda tela com coluna é filha do `RailLayout`, que monta a
 * coluna UMA vez; as telas de sistema ficam fora dela — o erro pode ser
 * justamente da casca.
 */
export const ROTAS: RouteObject[] = [
  {
    errorElement: <ErroInesperado />,
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
