import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RailLayout, ToastHost } from "@/ui";
import { CONTA, GRUPOS } from "./navegacao";
import Painel from "./paginas/Painel";

/**
 * Toda tela com coluna lateral é filha da rota do `RailLayout`: ele monta a
 * coluna UMA vez e passa navegação e conta às telas pelo contexto.
 *
 * `basename` vem do `BASE_PATH` do build: `/` em desenvolvimento, `/Arcada/`
 * no GitHub Pages. Sem ele, toda rota da demo publicada cai no 404.
 */
const router = createBrowserRouter(
  [
    {
      element: <RailLayout grupos={GRUPOS} conta={CONTA} />,
      children: [{ path: "/", element: <Painel /> }],
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
