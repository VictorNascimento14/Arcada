import { useNavigate } from "react-router-dom";

import { diaISO, GlassCard, PageShell } from "@/ui";
import FormularioPaciente from "./FormularioPaciente";
import { cadastrarPaciente } from "./regras";

/** `/pacientes/novo`: o cadastro. Salvar leva à ficha do paciente novo. */
export default function CadastroPaciente() {
  const navigate = useNavigate();

  return (
    <PageShell titulo="Novo paciente">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="p-[26px]">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Dados do paciente</h2>
          <p className="mt-1 text-foreground-500">Nome e data de nascimento são obrigatórios.</p>
          <FormularioPaciente
            aoEnviar={(dados) => navigate(`/pacientes/${cadastrarPaciente(dados, diaISO(new Date())).id}`)}
            aoCancelar={() => navigate("/pacientes")}
          />
        </GlassCard>
      </main>
    </PageShell>
  );
}
