import { PageShell } from "@/ui";

import PlanosSemParcelas from "./PlanosSemParcelas";

/** `/financeiro`: o que o consultório tem a receber e, primeiro, os planos aprovados que ainda esperam as parcelas. */
export default function PaginaFinanceiro() {
  return (
    <PageShell titulo="Financeiro" detalhe="Parcelas dos planos">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <PlanosSemParcelas />
      </main>
    </PageShell>
  );
}
