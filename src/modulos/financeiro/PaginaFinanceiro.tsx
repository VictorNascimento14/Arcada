import { PageShell } from "@/ui";

import ContasAReceber from "./ContasAReceber";
import PlanosSemParcelas from "./PlanosSemParcelas";

/** `/financeiro`: o que o consultório tem a receber e, logo abaixo, os planos aprovados que ainda esperam as parcelas. */
export default function PaginaFinanceiro() {
  return (
    <PageShell titulo="Financeiro" detalhe="Contas a receber">
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <ContasAReceber />
        <PlanosSemParcelas />
      </main>
    </PageShell>
  );
}
