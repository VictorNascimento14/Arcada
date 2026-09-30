import { useState } from "react";

import { nomeFace } from "@/dominio/fdi";
import { GlassCard } from "@/ui";

import BarraDeCondicoes from "./BarraDeCondicoes";
import { CONDICAO_POR_ID, CONDICOES, ehCondicaoDeFace, type CondicaoId } from "./condicoes";
import { alternarMarcaDoPaciente, useMarcas } from "./dados";
import type { Marca } from "./marcas";
import Odontograma from "./Odontograma";

/**
 * A aba "Odontograma" da ficha do paciente: a barra que escolhe a condição e o odontograma onde ela se marca.
 * Numa face, a condição se aplica ao clicar (ou `Enter`, `Espaço`) e se remove ao clicar de novo; no dente
 * inteiro, pelo número. O que foi marcado fica guardado por paciente (`dados.ts`).
 */
export default function AbaOdontograma({ pacienteId }: { pacienteId: string }) {
  const marcas = useMarcas(pacienteId);
  const [escolhida, setEscolhida] = useState<CondicaoId>(CONDICOES[0].id);
  const [aviso, setAviso] = useState("");

  // Sem isto, quem usa leitor de tela não sabe o resultado do clique: o nome da face muda, mas não é lido sozinho.
  function alternar(marca: Marca, onde: string) {
    const aplicada = alternarMarcaDoPaciente(pacienteId, marca);
    setAviso(`${aplicada ? "Marcado" : "Desmarcado"}: ${CONDICAO_POR_ID[marca.condicao].rotulo.toLowerCase()} ${onde}.`);
  }

  return (
    <GlassCard className="flex flex-col gap-6 p-5 md:p-[26px]">
      <BarraDeCondicoes escolhida={escolhida} aoEscolher={setEscolhida} />
      <Odontograma
        marcas={marcas}
        onFace={
          ehCondicaoDeFace(escolhida)
            ? (dente, face) => alternar({ dente, face, condicao: escolhida }, `na face ${nomeFace(face)} do dente ${dente}`)
            : undefined
        }
        onDente={ehCondicaoDeFace(escolhida) ? undefined : (dente) => alternar({ dente, condicao: escolhida }, `no dente ${dente}`)}
      />
      <p role="status" className="sr-only">
        {aviso}
      </p>
    </GlassCard>
  );
}
