import type { Modulo } from "../tipos";
import AbaTratamentos from "./AbaTratamentos";
import TelaDoPlano from "./TelaDoPlano";

// O item da coluna (`/tratamentos`) entra com a lista dos planos em aberto (item 7.9): antes dela, seria um link para uma página que não existe.
export const modulo: Modulo = {
  chave: "tratamentos",
  rotas: [{ path: "/planos/:planoId", Component: TelaDoPlano }],
  abaPaciente: { ordem: 40, rotulo: "Tratamentos", Componente: AbaTratamentos },
};
