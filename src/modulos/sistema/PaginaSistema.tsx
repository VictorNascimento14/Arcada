import { PageShell } from "@/ui";

import BuscaGlobal from "./BuscaGlobal";
import CartaoDeBackup from "./CartaoDeBackup";
import CartaoDeBusca from "./CartaoDeBusca";
import CartaoDeRestauracao from "./CartaoDeRestauracao";

/** A tela `/sistema`: um cartão por assunto do sistema (dados do navegador), empilhados. */
export default function PaginaSistema() {
  return (
    <PageShell titulo="Sistema" detalhe="Cadastro">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <CartaoDeBackup />
        <CartaoDeRestauracao />
        <CartaoDeBusca />
        <BuscaGlobal />
      </main>
    </PageShell>
  );
}
