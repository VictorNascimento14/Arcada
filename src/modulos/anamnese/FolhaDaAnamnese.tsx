import { createPortal } from "react-dom";

import type { Paciente } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import type { Anamnese } from "./dados";
import RespostasDaAnamnese from "./RespostasDaAnamnese";

type Props = { paciente: Pick<Paciente, "nome">; versao: Anamnese; numero: number };

/**
 * A folha de uma versão da anamnese para o papel: cabeçalho com o nome do paciente, a data e a versão, as
 * respostas e, no fim, a linha para o paciente assinar à mão. Só o nome entra da ficha: nada de CPF ou telefone.
 *
 * Vai por portal direto no `<body>`, com `data-print-clone`: é o que o CSS de impressão do kit espera
 * (`src/ui/index.css`). Na tela ela fica escondida; com `data-print-mode="clone"` no `<body>` só ela sai no
 * papel. Cor fixa (`text-black`), porque no tema escuro os tokens do app seriam claros sobre o papel branco.
 */
export default function FolhaDaAnamnese({ paciente, versao, numero }: Props) {
  return createPortal(
    <div data-print-clone="" className="bg-white text-black">
      <header className="mb-4 border-b border-black pb-3">
        <h1 className="text-2xl font-bold">Anamnese</h1>
        <p className="mt-1">
          Paciente: <strong>{paciente.nome}</strong>
        </p>
        <p>
          Data: {dataBR(versao.data)} · Versão {numero}
        </p>
      </header>

      <RespostasDaAnamnese respostas={versao.respostas} />

      {/* O espaço acima da linha é onde o paciente assina. `break-inside-avoid` e `break-before-avoid` não deixam a linha
          sozinha numa página: a última seção vem junto, se couber. */}
      <footer className="mt-12 break-inside-avoid break-before-avoid">
        <div className="w-3/4 border-t border-black" />
        <p className="mt-1 text-sm">Assinatura do paciente</p>
      </footer>
    </div>,
    document.body,
  );
}
