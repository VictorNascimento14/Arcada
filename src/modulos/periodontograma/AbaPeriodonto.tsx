import { useState, type KeyboardEvent } from "react";

import type { Arcada, NumeroDente } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { diaISO, GlassCard } from "@/ui";

import { alternarSinal, registrarMedida, useExameDoDia } from "./dados";
import type { Sitio } from "./exame";
import GradeDeSondagem from "./GradeDeSondagem";
import IndicesDoExame from "./IndicesDoExame";
import { CAMPOS_DE_MEDIDA, faixaDoCampo, type CampoMedida, type Sinal } from "./grade";

/**
 * A aba "Periodonto" da ficha do paciente: o exame periodontal de hoje, com a arcada superior e a inferior. Cada
 * dia tem o seu exame — o de hoje começa em branco e os dos dias anteriores ficam guardados (`dados.ts`) — e o
 * que se digita ou se marca é gravado na hora, sem botão de salvar. Valor que não serve é recusado com um aviso, e o campo
 * volta ao que estava. Acima da grade, os índices do exame em cartões. As setas percorrem a grade (`navegar`); Tab
 * segue a ordem natural dos campos.
 */
export default function AbaPeriodonto({ pacienteId }: { pacienteId: string }) {
  // A ficha reaproveita a aba ao trocar de paciente: a `key` impede que o aviso de um apareça na tela do outro.
  return <ExameDeHoje key={pacienteId} pacienteId={pacienteId} />;
}

const ARCADAS: readonly Arcada[] = ["superior", "inferior"];

/**
 * As setas movem o foco pela grade como numa planilha: direita e esquerda ao campo seguinte e ao anterior — de
 * sítio em sítio, e na ponta da linha ao dente vizinho, como o Tab —; cima e baixo ao mesmo campo do dente de
 * cima e do de baixo, passando de uma arcada à outra. O campo que recebe o foco vem com o conteúdo selecionado,
 * para digitar por cima. Com Shift, Ctrl, Alt ou Meta a seta é do navegador (estender a seleção, por exemplo).
 */
function navegar(e: KeyboardEvent<HTMLDivElement>) {
  const atual = e.target;
  if (!(atual instanceof HTMLElement) || !atual.matches("[data-celula]") || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
  const porLinha = atual.closest("tr")?.querySelectorAll("[data-celula]").length ?? 0;
  const passo = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? porLinha : e.key === "ArrowUp" ? -porLinha : 0;
  if (!passo) return;
  // Nas pontas a seta também é da grade: numa caixa de número, cima e baixo somariam ao valor.
  e.preventDefault();
  const celulas = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-celula]")];
  const destino = celulas[celulas.indexOf(atual) + passo];
  if (!destino) return;
  destino.focus();
  if (destino instanceof HTMLInputElement) destino.select();
}

function ExameDeHoje({ pacienteId }: { pacienteId: string }) {
  const hoje = diaISO(new Date());
  const exame = useExameDoDia(pacienteId, hoje);
  const [aviso, setAviso] = useState("");

  function medir(dente: NumeroDente, sitio: Sitio, campo: CampoMedida, valor: number | undefined) {
    const gravou = registrarMedida(pacienteId, dente, sitio, campo, valor);
    setAviso(gravou ? "" : `${CAMPOS_DE_MEDIDA[campo].rotulo}: use um número inteiro de ${faixaDoCampo(campo)}.`);
  }

  function alternar(dente: NumeroDente, sitio: Sitio, sinal: Sinal) {
    setAviso(alternarSinal(pacienteId, dente, sitio, sinal) ? "" : "Não foi possível gravar: o paciente não foi encontrado.");
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="flex flex-col gap-1 p-5 md:p-[26px]">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-foreground-950">Exame periodontal de {dataBR(hoje)}</h2>
        <p className="text-sm text-foreground-500">
          Cada dia tem o seu exame: o de hoje começa em branco e os dos dias anteriores ficam guardados. O que você digita é gravado na
          hora.
        </p>
        <p className="text-sm text-foreground-500">
          Medidas em milímetros, sempre inteiras: profundidade de {faixaDoCampo("profundidade")} e margem de {faixaDoCampo("margem")}. Sangramento e
          supuração se marcam por sítio, com um clique. Tab e as setas percorrem os campos: direita e esquerda, de sítio em
          sítio; cima e baixo, de dente em dente.
        </p>
        <p role="status" className="text-sm text-red-700">
          {aviso}
        </p>
      </GlassCard>
      <IndicesDoExame dentes={exame?.dentes ?? {}} />
      <GlassCard className="p-5 md:p-[26px]">
        <div onKeyDown={navegar} className="flex flex-col gap-8">
          {ARCADAS.map((arcada) => (
            <GradeDeSondagem key={arcada} arcada={arcada} dentes={exame?.dentes ?? {}} aoMedir={medir} aoAlternar={alternar} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
