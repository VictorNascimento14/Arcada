import type { Modulo } from "../tipos";
import AbaAtendimentos from "./AbaAtendimentos";
import TelaDoAtendimento from "./TelaDoAtendimento";

// Sem item na coluna: o atendimento começa pela consulta, na aba da ficha do paciente.
export const modulo: Modulo = {
  chave: "atendimento",
  rotas: [{ path: "/atendimento/:consultaId", Component: TelaDoAtendimento }],
  abaPaciente: { ordem: 60, rotulo: "Atendimentos", Componente: AbaAtendimentos },
};
