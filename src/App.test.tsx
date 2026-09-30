import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("abre no painel, dentro da casca", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Bem-vinda ao Arcada" })).toBeTruthy();
    expect(screen.getAllByText("Painel").length).toBeGreaterThan(0);
  });
});
