import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ToastHost } from "@/ui";
import { ROTAS } from "./rotas";

/**
 * `basename` vem do `BASE_PATH` do build: `/` em desenvolvimento, `/Arcada/`
 * no GitHub Pages. Sem ele, toda rota da demo publicada cai no 404.
 */
const router = createBrowserRouter(ROTAS, { basename: import.meta.env.BASE_URL });

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastHost />
    </>
  );
}
