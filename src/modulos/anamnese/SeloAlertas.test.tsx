import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { anamneses, type Anamnese } from "./dados";
import { PERGUNTAS, type Respostas } from "./questionario";
import SeloAlertas from "./SeloAlertas";

/** Toda pergunta sim/não respondida "não": uma ficha completa e sem alerta. */
const MINIMAS = Object.fromEntries(PERGUNTAS.filter((p) => p.tipo === "simNao").map((p) => [p.id, { sim: false }])) as Respostas;

const versao = (id: string, pacienteId: string, data: string, mais: Respostas = {}): Anamnese => ({
  id,
  pacienteId,
  data,
  respostas: { ...MINIMAS, ...mais },
});

const alertas = () => screen.queryAllByRole("listitem").map((li) => li.textContent);

beforeEach(() => {
  localStorage.clear();
  anamneses.substituirTudo([]);
});

describe("SeloAlertas", () => {
  it("mostra um alerta por pílula, só os da versão mais recente do paciente", () => {
    anamneses.substituirTudo([
      versao("a", "p1", "2026-03-10", { diabetes: { sim: true } }), // antiga: não vale mais
      versao("b", "p1", "2026-09-30", { alergia: { sim: true, detalhe: "Penicilina" }, gestante: { sim: true } }),
      versao("c", "p2", "2026-10-01", { anticoagulante: { sim: true } }), // de outro paciente
    ]);

    render(<SeloAlertas pacienteId="p1" />);

    expect(screen.getByRole("list", { name: "Alertas da anamnese" })).toBeTruthy();
    expect(alertas()).toEqual(["Alergia informada: Penicilina", "Gestante"]);
  });

  it("não desenha nada sem anamnese, sem resposta sim, nem quando o registro não passa na validação", () => {
    anamneses.substituirTudo([
      versao("a", "p1", "2026-09-30"),
      { id: "b", pacienteId: "p3", data: "2026-09-30", respostas: { ...MINIMAS, alergia: null } as unknown as Respostas },
    ]);

    for (const id of ["p1", "p2", "p3"]) {
      const { container, unmount } = render(<SeloAlertas pacienteId={id} />);
      expect(container.firstChild).toBeNull();
      unmount();
    }
  });

  it("acompanha a coleção: aparece quando uma versão com alerta é gravada e some na seguinte sem alerta", () => {
    const { container } = render(<SeloAlertas pacienteId="p1" />);
    expect(container.firstChild).toBeNull();

    act(() => anamneses.salvar(versao("a", "p1", "2026-09-30", { hipertensao: { sim: true } })));
    expect(alertas()).toEqual(["Pressão alta informada"]);

    act(() => anamneses.salvar(versao("b", "p1", "2026-09-30")));
    expect(container.firstChild).toBeNull();
  });
});
