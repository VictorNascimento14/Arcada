import { PageShell } from "@/ui";

import Atestado from "./Atestado";
import Declaracao from "./Declaracao";
import Receituario from "./Receituario";

/** A tela `/documentos`: um cartão por documento, empilhados. */
export default function PaginaDocumentos() {
  return (
    <PageShell titulo="Documentos" detalhe="Impressão">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <p className="text-foreground-500">
          A v1 é demonstração: o documento sai com linha para assinatura à mão e não tem validade jurídica.
        </p>
        <Receituario />
        <Atestado />
        <Declaracao />
      </main>
    </PageShell>
  );
}
