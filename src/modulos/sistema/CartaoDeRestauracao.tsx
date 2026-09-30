import { useState } from "react";

import { restaurarDemonstracao } from "@/dados/backup";
import { Button, GlassCard, Modal } from "@/ui";

/**
 * O cartão da restauração: apaga o que o navegador guarda do Arcada e recarrega a página, para as sementes plantarem
 * de novo os dados fictícios de demonstração. O tema e a coluna lateral não são dados e ficam como estão. Só existe a
 * confirmação montada enquanto aberta: cada abertura começa do zero.
 */
export default function CartaoDeRestauracao() {
  const [confirmando, setConfirmando] = useState(false);

  function restaurar() {
    restaurarDemonstracao();
    location.reload(); // as coleções guardam o estado em memória — ver `src/dados/backup.ts`
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Restaurar a demonstração</h2>
      <p className="mt-1 text-foreground-500">
        Apaga o que foi cadastrado neste navegador e volta aos dados fictícios de exemplo. O tema e a coluna lateral
        continuam como estão.
      </p>

      <div className="mt-6">
        <Button variant="secondary" onClick={() => setConfirmando(true)}>
          <i className="ri-restart-line text-base" aria-hidden="true" />
          Restaurar demonstração
        </Button>
      </div>

      {confirmando && (
        <Modal
          aberto
          titulo="Apagar tudo e restaurar a demonstração?"
          onFechar={() => setConfirmando(false)}
          rodape={
            <>
              <Button variant="ghost" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button onClick={restaurar}>Apagar e restaurar</Button>
            </>
          }
        >
          <p className="text-foreground-700">
            Pacientes, agenda, financeiro e prontuário cadastrados neste navegador são apagados, e a página recarrega
            com os dados de exemplo.
          </p>
          <p className="mt-3 text-foreground-700">
            Isso não pode ser desfeito. Para guardar o que existe hoje, exporte um backup antes.
          </p>
        </Modal>
      )}
    </GlassCard>
  );
}
