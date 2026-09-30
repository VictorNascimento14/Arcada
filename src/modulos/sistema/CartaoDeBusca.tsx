import { Button, GlassCard } from "@/ui";

import { abrirBusca } from "./atalhoDeBusca";

/** O cartão da busca global: diz o atalho e dá um botão que faz o mesmo, para quem não o conhece (e para o teste). */
export default function CartaoDeBusca() {
  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Busca de pacientes</h2>
      <p className="mt-1 text-foreground-500">
        <strong>Ctrl + K</strong> (<strong>⌘ + K</strong> no Mac) abre a busca: digite o nome, sem se preocupar com
        acento, e Enter abre a ficha do paciente.
      </p>

      <div className="mt-6">
        <Button variant="secondary" onClick={() => abrirBusca()}>
          <i className="ri-search-line text-base" aria-hidden="true" />
          Buscar
        </Button>
      </div>
    </GlassCard>
  );
}
