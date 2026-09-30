import { Link } from "react-router-dom";

import { dataBR } from "@/modulos/pacientes/exibicao";
import { Avatar, Button, GlassCard, toast } from "@/ui";

import { reativarRetorno } from "./dados";
import type { RetornoDispensado } from "./lista";

/** Os retornos dispensados, com o dia e o motivo de cada um e o botão que desfaz a dispensa. A lista só monta o cartão se houver algum. */
export default function Dispensados({ dispensados }: { dispensados: RetornoDispensado[] }) {
  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Dispensados</h2>
      <p className="mt-1 text-foreground-500">
        Retornos que a clínica decidiu não cobrar, do mais recente ao mais antigo. Quando o paciente é atendido de novo, o retorno volta a contar.
      </p>
      <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
        {dispensados.map(({ paciente, dispensadoEm, motivo }) => (
          <li key={paciente.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
              <span aria-hidden="true">
                <Avatar nome={paciente.nome} size={40} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground-950">
                  <Link to={`/pacientes/${paciente.id}`} className="hover:underline">
                    {paciente.nome}
                  </Link>
                </p>
                <p className="text-sm text-foreground-500">
                  Dispensado em {dataBR(dispensadoEm)} · motivo: {motivo}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                reativarRetorno(paciente.id);
                toast("Retorno reativado", paciente.nome);
              }}
            >
              Reativar <span className="sr-only">o retorno de {paciente.nome}</span>
            </Button>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
