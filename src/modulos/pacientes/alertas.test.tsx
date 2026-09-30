import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes } from "@/dados/colecoes";
import { anamneses } from "@/modulos/anamnese/dados";
import { PERGUNTAS, type Respostas } from "@/modulos/anamnese/questionario";

import ListaPacientes from "./ListaPacientes";

/** Todas as perguntas sim/não respondidas "não", menos a alergia — a anamnese só vale completa. */
function respostasComAlergia(): Respostas {
  const r: Record<string, unknown> = {};
  for (const p of PERGUNTAS) if (p.tipo === "simNao") r[p.id] = { sim: false };
  r.alergia = { sim: true, detalhe: "látex" };
  return r as Respostas;
}

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([
    { id: "com-alerta", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "(00) 90000-0001" },
    { id: "sem-alerta", nome: "Outra Pessoa Exemplo", nascimento: "1985-01-01", telefone: "(00) 90000-0002" },
  ]);
  anamneses.substituirTudo([{ id: "a1", pacienteId: "com-alerta", data: "2026-09-30", respostas: respostasComAlergia() }]);
});

describe("alertas da anamnese na lista de pacientes", () => {
  it("mostra o alerta só no cartão de quem informou", () => {
    render(
      <MemoryRouter>
        <ListaPacientes />
      </MemoryRouter>,
    );
    const selos = screen.getAllByRole("list", { name: "Alertas da anamnese" });
    expect(selos).toHaveLength(1);
    expect(selos[0].textContent).toContain("Alergia informada: látex");
  });
});
