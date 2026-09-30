import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { Profissional } from "@/dominio";

type Props = {
  /** O nome do documento (`Receituário`, `Atestado`…). */
  titulo: string;
  /** Quem assina: o nome e o CRO saem sob a linha de assinatura. */
  profissional: Pick<Profissional, "nome" | "cro">;
  /** O corpo do documento. */
  children: ReactNode;
};

/**
 * A folha de um documento para o papel: cabeçalho com os dados da clínica (nome, endereço, cidade/UF e telefone do
 * registro `CLINICA_ID`), o título, o corpo e, no fim, a linha para assinar à mão com o nome e o CRO do profissional.
 * A v1 é demonstração: não há assinatura digital nem validade jurídica, e a folha só imprime o que foi digitado.
 *
 * Vai por portal direto no `<body>`, com `data-print-clone`: é o que o CSS de impressão do kit espera
 * (`src/ui/index.css`). Na tela fica escondida; quem imprime usa `useImpressao`, que liga o modo de impressão e
 * desfaz no `afterprint`. Cor fixa (`text-black`): no tema escuro os tokens do app seriam claros sobre o papel branco.
 */
export default function FolhaImpressa({ titulo, profissional, children }: Props) {
  const registro = useColecao(clinica).find((c) => c.id === CLINICA_ID);
  // "Rua Exemplo, 100 — São Paulo/SP": sem sobra de separador quando falta um dos campos.
  const local = [registro?.cidade, registro?.uf].filter(Boolean).join("/");
  const endereco = [registro?.endereco, local].filter(Boolean).join(" — ");

  return createPortal(
    <div data-print-clone="" className="bg-white text-black">
      {registro && (
        <header className="mb-6 border-b border-black pb-3 text-center">
          <p className="text-xl font-bold">{registro.nome}</p>
          {endereco && <p className="text-sm">{endereco}</p>}
          {registro.telefone && <p className="text-sm">Tel. {registro.telefone}</p>}
        </header>
      )}

      <h1 className="mb-4 text-2xl font-bold">{titulo}</h1>
      {children}

      {/* O espaço acima da linha é onde o profissional assina. `break-inside-avoid` e `break-before-avoid` não deixam a
          linha sozinha numa página: o fim do corpo vem junto, se couber. */}
      <footer className="mt-12 break-inside-avoid break-before-avoid">
        <hr className="w-3/4 border-0 border-t border-black" />
        <p className="mt-1 font-semibold">{profissional.nome}</p>
        <p className="text-sm">{profissional.cro}</p>
      </footer>
    </div>,
    document.body,
  );
}
