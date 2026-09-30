import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";

import FichaPaciente from "./FichaPaciente";

const rolar = vi.fn();

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([{ id: "p1", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "(00) 90000-0001" }]);
  Element.prototype.scrollIntoView = rolar;
});

afterEach(() => {
  rolar.mockClear();
  // @ts-expect-error — o jsdom não tem o método; o teste o pôs e o tira.
  delete Element.prototype.scrollIntoView;
});

describe("barra de abas da ficha", () => {
  it("rola a aba escolhida para dentro da tela, sem sair da linha", () => {
    render(
      <MemoryRouter initialEntries={["/pacientes/p1"]}>
        <Routes>
          <Route path="/pacientes/:id" element={<FichaPaciente />} />
        </Routes>
      </MemoryRouter>,
    );
    const ultima = screen.getAllByRole("tab").at(-1)!;
    rolar.mockClear();
    fireEvent.click(ultima);
    expect(rolar).toHaveBeenCalledTimes(1);
    expect(rolar.mock.contexts[0]).toBe(ultima);
    expect(rolar).toHaveBeenCalledWith(expect.objectContaining({ block: "nearest", inline: "nearest" }));
  });
});
