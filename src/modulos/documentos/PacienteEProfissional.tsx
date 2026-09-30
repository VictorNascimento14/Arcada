import { useMemo } from "react";

import { pacientes, profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { profissionalAtivo } from "@/dominio";
import { filtrarPacientes } from "@/modulos/pacientes/busca";

import Selecao from "./Selecao";
import type { ErrosDaEscolha } from "./validacao";

type Props = {
  /** Prefixo dos ids dos campos: a tela pode ter mais de um documento. */
  id: string;
  pacienteId: string;
  profissionalId: string;
  erros: ErrosDaEscolha;
  aoMudar: (campo: "pacienteId" | "profissionalId", valor: string) => void;
};

/**
 * As duas escolhas de todo documento, para dentro da grade do formulário: o paciente, em ordem alfabética, e quem
 * assina, só entre os profissionais ativos.
 *
 * ponytail: o paciente é um `<select>` com a lista inteira, como em `MarcarConsulta`. Com centenas de pacientes, o
 * próximo degrau é uma busca como a da lista de pacientes.
 */
export default function PacienteEProfissional({ id, pacienteId, profissionalId, erros, aoMudar }: Props) {
  const lista = useColecao(pacientes);
  const ordenados = useMemo(() => filtrarPacientes(lista, ""), [lista]);
  const ativos = useColecao(profissionais).filter(profissionalAtivo);

  return (
    <>
      <Selecao
        id={`${id}-paciente`}
        rotulo="Paciente"
        valor={pacienteId}
        aoMudar={(v) => aoMudar("pacienteId", v)}
        erro={erros.pacienteId}
        desabilitada={ordenados.length === 0}
      >
        <option value="">{ordenados.length === 0 ? "Nenhum paciente cadastrado" : "Escolha o paciente"}</option>
        {ordenados.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </Selecao>
      <Selecao
        id={`${id}-profissional`}
        rotulo="Profissional"
        valor={profissionalId}
        aoMudar={(v) => aoMudar("profissionalId", v)}
        erro={erros.profissionalId}
        desabilitada={ativos.length === 0}
      >
        <option value="">{ativos.length === 0 ? "Nenhum profissional ativo" : "Escolha o profissional"}</option>
        {ativos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </Selecao>
    </>
  );
}
