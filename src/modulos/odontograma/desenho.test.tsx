import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CONDICOES } from "./condicoes";
import { IconeDaCondicao } from "./desenho";

/** O ícone de cada condição, já desmontado: o que interessa é o símbolo e a cor dele. */
const simboloDe = (id: (typeof CONDICOES)[number]["id"]) => {
  const { container, unmount } = render(<IconeDaCondicao id={id} />);
  const simbolo = container.querySelector(`[data-simbolo="${id}"]`);
  const resultado = { decorativo: container.querySelector("svg")?.getAttribute("aria-hidden"), classes: [...(simbolo?.classList ?? [])], desenho: simbolo?.innerHTML };
  unmount();
  return resultado;
};

describe("IconeDaCondicao", () => {
  it("é decorativo e leva o símbolo da condição na cor dela", () => {
    for (const { id, cor } of CONDICOES) {
      const { decorativo, classes } = simboloDe(id);

      expect(decorativo).toBe("true");
      expect(classes).toEqual(expect.arrayContaining(cor.split(" ")));
    }
  });

  it("dá a cada condição um símbolo diferente: a cor não é o único sinal", () => {
    const desenhos = CONDICOES.map(({ id }) => simboloDe(id).desenho);

    expect(desenhos.every(Boolean)).toBe(true);
    expect(new Set(desenhos).size).toBe(CONDICOES.length);
  });
});
