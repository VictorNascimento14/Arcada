import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CartaoDeRestauracao from "./CartaoDeRestauracao";

const recarregar = vi.fn();
const foto = () => Object.fromEntries(Object.entries(localStorage));

beforeEach(() => {
  localStorage.clear();
  recarregar.mockClear();
  // O jsdom não recarrega: o dublê registra o que o app pediria ao navegador.
  vi.stubGlobal("location", { ...window.location, reload: recarregar });
});

afterEach(() => vi.unstubAllGlobals());

const abrir = () => {
  render(<CartaoDeRestauracao />);
  fireEvent.click(screen.getByRole("button", { name: "Restaurar demonstração" }));
  return screen.getByRole("dialog", { name: "Apagar tudo e restaurar a demonstração?" });
};

describe("restaurar a demonstração", () => {
  it("pede confirmação antes de apagar; cancelar deixa tudo como estava", () => {
    localStorage.setItem("arcada:pacientes", "dado");
    const dialogo = abrir();
    expect(dialogo.textContent).toMatch(/não pode ser desfeito/);
    expect(localStorage.getItem("arcada:pacientes")).toBe("dado");

    fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(foto()).toEqual({ "arcada:pacientes": "dado" });
    expect(recarregar).not.toHaveBeenCalled();
  });

  it("ao confirmar, apaga as chaves arcada:* com as marcas de semente, poupa o resto e recarrega", () => {
    localStorage.setItem("arcada:pacientes", "dado");
    localStorage.setItem("arcada:sementes:nucleo", "1");
    localStorage.setItem("arcada-tema", "escuro");
    const dialogo = abrir();

    fireEvent.click(within(dialogo).getByRole("button", { name: "Apagar e restaurar" }));

    expect(foto()).toEqual({ "arcada-tema": "escuro" });
    expect(recarregar).toHaveBeenCalledOnce();
  });
});
