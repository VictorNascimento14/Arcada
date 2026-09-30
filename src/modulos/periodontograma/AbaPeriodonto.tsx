import { useState } from "react";

import type { NumeroDente } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { diaISO, GlassCard } from "@/ui";

import { registrarMedida, useExameDoDia } from "./dados";
import type { Sitio } from "./exame";
import GradeDeSondagem from "./GradeDeSondagem";
import { CAMPOS_DE_MEDIDA, faixaDoCampo, type CampoMedida } from "./grade";

/**
 * A aba "Periodonto" da ficha do paciente: o exame periodontal de hoje. Cada dia tem o seu exame — o de hoje
 * começa em branco e os dos dias anteriores ficam guardados (`dados.ts`) — e o que se digita é gravado na hora,
 * sem botão de salvar. Valor que não serve é recusado com um aviso, e o campo volta ao que estava.
 */
export default function AbaPeriodonto({ pacienteId }: { pacienteId: string }) {
  // A ficha reaproveita a aba ao trocar de paciente: a `key` impede que o aviso de um apareça na tela do outro.
  return <ExameDeHoje key={pacienteId} pacienteId={pacienteId} />;
}

function ExameDeHoje({ pacienteId }: { pacienteId: string }) {
  const hoje = diaISO(new Date());
  const exame = useExameDoDia(pacienteId, hoje);
  const [aviso, setAviso] = useState("");

  function medir(dente: NumeroDente, sitio: Sitio, campo: CampoMedida, valor: number | undefined) {
    const gravou = registrarMedida(pacienteId, dente, sitio, campo, valor);
    setAviso(gravou ? "" : `${CAMPOS_DE_MEDIDA[campo].rotulo}: use um número inteiro de ${faixaDoCampo(campo)}.`);
  }

  return (
    <GlassCard className="flex flex-col gap-4 p-5 md:p-[26px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-foreground-950">Exame periodontal de {dataBR(hoje)}</h2>
        <p className="text-sm text-foreground-500">
          Cada dia tem o seu exame: o de hoje começa em branco e os dos dias anteriores ficam guardados. O que você digita é gravado na
          hora.
        </p>
        <p className="text-sm text-foreground-500">
          Medidas em milímetros, sempre inteiras: profundidade de {faixaDoCampo("profundidade")} e margem de {faixaDoCampo("margem")}.
        </p>
        <p role="status" className="text-sm text-red-700">
          {aviso}
        </p>
      </div>
      <GradeDeSondagem arcada="superior" dentes={exame?.dentes ?? {}} aoMedir={medir} />
    </GlassCard>
  );
}
