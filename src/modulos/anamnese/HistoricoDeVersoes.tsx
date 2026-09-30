import { useEffect, useState } from "react";

import { pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, GlassCard, Modal } from "@/ui";
import { anamneses, versoesDoPaciente, type Anamnese } from "./dados";
import FolhaDaAnamnese from "./FolhaDaAnamnese";
import RespostasDaAnamnese from "./RespostasDaAnamnese";

/**
 * As versões da anamnese do paciente, da mais nova à mais antiga, e as respostas de cada uma para ler. A
 * versão 1 é a mais antiga: o número sai da posição, já que só se acrescenta versão, nunca se tira. Sem versão
 * gravada, não desenha nada. Cada versão também se imprime.
 */
export default function HistoricoDeVersoes({ pacienteId }: { pacienteId: string }) {
  const versoes = versoesDoPaciente(useColecao(anamneses), pacienteId);
  const paciente = useColecao(pacientes).find((p) => p.id === pacienteId);
  const [aberta, setAberta] = useState<string | null>(null);
  const [folha, setFolha] = useState<{ versao: Anamnese; numero: number } | null>(null);

  // Imprimir: a folha (que a tela esconde) entra no <body>, o modo de impressão do kit se liga e o navegador abre
  // o diálogo; `afterprint` desfaz tudo, e a folha some. Um objeto novo por clique refaz o efeito, mesmo para
  // imprimir a mesma versão de novo.
  useEffect(() => {
    if (!folha) return;
    const limpar = () => setFolha(null);
    document.body.dataset.printMode = "clone";
    window.addEventListener("afterprint", limpar);
    window.print();
    return () => {
      window.removeEventListener("afterprint", limpar);
      delete document.body.dataset.printMode;
    };
  }, [folha]);

  if (versoes.length === 0) return null;

  // ponytail: a lista não pagina — uma versão por salvamento cresce devagar. Se crescer, mostrar as mais novas e
  // um "ver todas".
  const numero = (posicao: number) => versoes.length - posicao;
  const escolhida = versoes.findIndex((v) => v.id === aberta); // -1: nenhuma aberta

  return (
    <GlassCard className="p-5 md:p-[26px]">
      <h2 className="text-xl font-bold text-foreground-950">Histórico de versões</h2>
      <p className="mt-0.5 text-foreground-500">Cada salvamento é uma versão, e as anteriores ficam guardadas como estavam.</p>

      <ol className="mt-4 divide-y divide-foreground-950/[0.08]">
        {versoes.map((v, i) => (
          <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <span className="font-semibold text-foreground-950">Versão {numero(i)}</span>
            <time dateTime={v.data} className="text-foreground-500">
              {dataBR(v.data)}
            </time>
            {i === 0 && (
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">Vigente</span>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                variant="secondary"
                aria-label={`Ver respostas da versão ${numero(i)}`}
                onClick={() => setAberta(v.id)}
              >
                Ver respostas
              </Button>
              <Button
                variant="ghost"
                disabled={!paciente}
                aria-label={`Imprimir a versão ${numero(i)}`}
                onClick={() => setFolha({ versao: v, numero: numero(i) })}
              >
                <i className="ri-printer-line" aria-hidden="true" />
                Imprimir
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <Modal
        aberto={escolhida >= 0}
        titulo={escolhida >= 0 ? `Versão ${numero(escolhida)} · ${dataBR(versoes[escolhida].data)}` : ""}
        onFechar={() => setAberta(null)}
        largura="lg"
      >
        {escolhida >= 0 && <RespostasDaAnamnese respostas={versoes[escolhida].respostas} />}
      </Modal>

      {folha && paciente && <FolhaDaAnamnese paciente={paciente} versao={folha.versao} numero={folha.numero} />}
    </GlassCard>
  );
}
