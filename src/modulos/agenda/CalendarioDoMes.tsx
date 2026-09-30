import { useMemo } from "react";

import { consultas } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { DataISO } from "@/dominio";
import { Calendar, diaISO, GlassCard } from "@/ui";

import { diasComConsulta } from "./dias";

/**
 * O calendário do mês do kit, com o ponto nos dias que têm consulta. Clicar num dia o abre na visão do dia.
 * O mês que ele mostra é dele: anda pelas setas do próprio calendário e não acompanha o dia aberto na grade.
 */
export default function CalendarioDoMes({ aoAbrirDia }: { aoAbrirDia: (dia: DataISO) => void }) {
  const todas = useColecao(consultas);
  const marcados = useMemo(() => diasComConsulta(todas), [todas]);

  return (
    <GlassCard as="section" aria-label="Calendário do mês" className="p-4">
      <Calendar marcados={marcados} onDayClick={(d) => aoAbrirDia(diaISO(d))} />
    </GlassCard>
  );
}
