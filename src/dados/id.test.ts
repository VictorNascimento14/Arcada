import { afterEach, describe, expect, it, vi } from "vitest";

import { novoId } from "./id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe("novoId", () => {
  it("devolve UUID v4 e não repete", () => {
    const ids = Array.from({ length: 100 }, () => novoId());
    expect(ids.every((id) => UUID_V4.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(100);
  });

  it("usa crypto.randomUUID quando existe", () => {
    const randomUUID = vi.fn(() => "00000000-0000-4000-8000-000000000000");
    vi.stubGlobal("crypto", { randomUUID });
    expect(novoId()).toBe("00000000-0000-4000-8000-000000000000");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  describe("fora de contexto seguro (sem randomUUID, só getRandomValues)", () => {
    const semRandomUUID = (preenche: (bytes: Uint8Array) => void) =>
      vi.stubGlobal("crypto", {
        getRandomValues: (bytes: Uint8Array) => {
          preenche(bytes);
          return bytes;
        },
      });

    it("monta um UUID v4 válido", () => {
      const real = globalThis.crypto;
      semRandomUUID((bytes) => void real.getRandomValues(bytes));
      const ids = Array.from({ length: 100 }, () => novoId());
      expect(ids.every((id) => UUID_V4.test(id))).toBe(true);
      expect(new Set(ids).size).toBe(100);
    });

    it("fixa os bits de versão e de variante, qualquer que seja o sorteio", () => {
      semRandomUUID((bytes) => void bytes.fill(0xff));
      expect(novoId()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
      semRandomUUID((bytes) => void bytes.fill(0x00));
      expect(novoId()).toBe("00000000-0000-4000-8000-000000000000");
    });
  });
});
