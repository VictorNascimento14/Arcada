import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RailLayout, ToastHost } from "@/ui";
import { NAVEGACAO } from "./modulos";
import { CONTA } from "./navegacao";

/**
 * Toda tela com coluna lateral é filha da rota do `RailLayout`: ele monta a
 * coluna UMA vez e passa navegação e conta às telas pelo contexto. As rotas e a
 * coluna vêm do registro de módulos (`src/modulos/`).
 *
 * `basename` vem do `BASE_PATH` do build: `/` em desenvolvimento, `/Arcada/`
 * no GitHub Pages. Sem ele, toda rota da demo publicada cai no 404.
 */
const router = createBrowserRouter(
  [
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
  ],
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastHost />
    </>
  );
}
