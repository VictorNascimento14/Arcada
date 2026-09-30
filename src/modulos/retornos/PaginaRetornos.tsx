import { PageShell } from "@/ui";

import ListaDeRetornos from "./ListaDeRetornos";

/** `/retornos`: quem deve voltar ao consultório, com os retornos vencidos e os dos próximos 30 dias. */
export default function PaginaRetornos() {
  return (
    <PageShell titulo="Retornos" detalhe="A vencer e vencidos">
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <ListaDeRetornos />
      </main>
    </PageShell>
  );
}
