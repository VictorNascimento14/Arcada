import { pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { GlassCard } from "@/ui";
import { formatarCpf } from "./cpf";
import { dataBR, rotuloConvenio } from "./exibicao";

/** A aba "Dados" da ficha: o cadastro do paciente, campo a campo. Mesmo formato das abas dos outros módulos. */
export default function DadosDoPaciente({ pacienteId }: { pacienteId: string }) {
  const paciente = useColecao(pacientes).find((p) => p.id === pacienteId);
  if (!paciente) return null;

  const campos: { rotulo: string; valor?: string; largo?: boolean }[] = [
    { rotulo: "Data de nascimento", valor: dataBR(paciente.nascimento) },
    { rotulo: "CPF", valor: paciente.cpf ? formatarCpf(paciente.cpf) : undefined },
    { rotulo: "Telefone", valor: paciente.telefone },
    { rotulo: "E-mail", valor: paciente.email },
    { rotulo: "Convênio", valor: rotuloConvenio(paciente) },
    { rotulo: "Observações", valor: paciente.observacoes, largo: true },
  ];

  return (
    <GlassCard className="p-[26px]">
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {campos.map(({ rotulo, valor, largo }) => (
          <div key={rotulo} className={largo ? "sm:col-span-2" : ""}>
            <dt className="text-sm font-medium text-foreground-500">{rotulo}</dt>
            {/* `whitespace-pre-line`: a observação digitada com quebras de linha aparece como foi escrita. */}
            <dd className={`mt-0.5 whitespace-pre-line ${valor ? "text-foreground-950" : "text-foreground-500"}`}>
              {valor || "Não informado"}
            </dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}
