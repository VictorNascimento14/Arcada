import { useEffect, useState } from "react";

import { GlassCard, PageShell } from "@/ui";

import ConsultasDeHoje from "./ConsultasDeHoje";
import { agoraISO } from "./hoje";
import IndicadoresDoMes from "./IndicadoresDoMes";

/**
 * O minuto de agora, `AAAA-MM-DDTHH:mm`. O painel fica aberto o dia inteiro: sem o relógio, a virada do dia e a
 * próxima consulta só mudariam ao recarregar. O tique é de um minuto, contado da montagem: o horário pode atrasar
 * até 59 s, o que basta para uma agenda que marca de 15 em 15 minutos.
 */
function useAgora() {
  const [agora, setAgora] = useState(() => agoraISO(new Date()));
  useEffect(() => {
    const id = setInterval(() => setAgora(agoraISO(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

export default function Painel() {
  const agora = useAgora();
  const dia = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <PageShell titulo="Painel" detalhe={dia}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Bem-vinda ao Arcada</h2>
          <p className="mt-2 text-foreground-500">
            Pacientes, agenda, odontograma e financeiro do consultório num lugar só.
          </p>
        </GlassCard>
        <IndicadoresDoMes hoje={agora.slice(0, 10)} />
        <ConsultasDeHoje agora={agora} />
      </main>
    </PageShell>
  );
}
