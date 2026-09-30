import { PageShell } from "@/ui";

import DadosDaClinica from "./DadosDaClinica";

/** A tela `/clinica`: um cartão por assunto da clínica, empilhados. */
export default function PaginaClinica() {
  return (
    <PageShell titulo="Clínica" detalhe="Cadastro">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <DadosDaClinica />
      </main>
    </PageShell>
  );
}
