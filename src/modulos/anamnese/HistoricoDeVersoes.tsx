import { useState } from "react";

import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, GlassCard, Modal } from "@/ui";
import { anamneses, versoesDoPaciente } from "./dados";
import RespostasDaAnamnese from "./RespostasDaAnamnese";

/**
 * As versões da anamnese do paciente, da mais nova à mais antiga, e as respostas de cada uma para ler. A
 * versão 1 é a mais antiga: o número sai da posição, já que só se acrescenta versão, nunca se tira. Sem versão
 * gravada, não desenha nada.
 */
export default function HistoricoDeVersoes({ pacienteId }: { pacienteId: string }) {
  const versoes = versoesDoPaciente(useColecao(anamneses), pacienteId);
  const [aberta, setAberta] = useState<string | null>(null);
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
            <Button
              variant="secondary"
              className="ml-auto"
              aria-label={`Ver respostas da versão ${numero(i)}`}
              onClick={() => setAberta(v.id)}
            >
              Ver respostas
            </Button>
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
    </GlassCard>
  );
}
