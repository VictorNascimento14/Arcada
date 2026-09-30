import { useState } from "react";

import type { Lancamento } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button } from "@/ui";

import FormularioDaBaixa from "./FormularioDaBaixa";

/**
 * O botão "Dar baixa" de uma parcela em aberto e o modal que ele abre. `quem` (o paciente) entra só no nome
 * acessível: numa lista, os botões precisam se distinguir.
 */
export default function BaixaDaParcela({ parcela, quem }: { parcela: Lancamento; quem?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Button variant="secondary" aria-label={`Dar baixa na parcela de ${dataBR(parcela.vencimento)}${quem ? ` de ${quem}` : ""}`} onClick={() => setAberto(true)}>
        Dar baixa
      </Button>
      {aberto && <FormularioDaBaixa parcela={parcela} aoFechar={() => setAberto(false)} />}
    </>
  );
}
