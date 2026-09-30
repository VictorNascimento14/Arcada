import { describe, expect, it } from "vitest";

import { adiadoPara, dataDoRetorno, estadoVigente, type EstadoDoRetorno } from "./estado";
import type { Retorno } from "./regra";

const HOJE = "2026-09-30";
const retorno = (retornoEm: string): Retorno => ({ pacienteId: "ana", ultimoAtendimento: "2026-03-10", intervaloMeses: 6, retornoEm });
const estado = (extra: Partial<EstadoDoRetorno> = {}): EstadoDoRetorno => ({ id: "ana", ultimoAtendimento: "2026-03-10", ...extra });

describe("estadoVigente", () => {
  it("vale para o retorno do mesmo último atendimento e não para o de um atendimento novo", () => {
    const adiado = estado({ adiadoAte: "2026-10-15" });

    expect(estadoVigente(adiado, retorno("2026-09-10"))).toBe(adiado);
    expect(estadoVigente(adiado, { ...retorno("2026-10-05"), ultimoAtendimento: "2026-04-05" })).toBeUndefined();
    expect(estadoVigente(undefined, retorno("2026-09-10"))).toBeUndefined();
  });
});

describe("dataDoRetorno", () => {
  it("é o dia da regra, ou o adiado quando ele passa o da regra", () => {
    expect(dataDoRetorno(retorno("2026-09-10"))).toBe("2026-09-10");
    expect(dataDoRetorno(retorno("2026-09-10"), estado({ adiadoAte: "2026-10-15" }))).toBe("2026-10-15");
    expect(dataDoRetorno(retorno("2026-09-10"), estado({ adiadoAte: "2026-09-01" }))).toBe("2026-09-10"); // nunca adianta para trás
    expect(dataDoRetorno(retorno("2026-09-10"), estado({ dispensadoEm: HOJE, motivo: "x" }))).toBe("2026-09-10");
  });
});

describe("adiadoPara", () => {
  it("o retorno vencido conta de hoje: somar ao dia vencido o deixaria vencido", () => {
    expect(adiadoPara(retorno("2026-09-10"), undefined, HOJE, 15)).toBe("2026-10-15");
  });

  it("o retorno que ainda vai vencer conta do dia dele, inclusive o de hoje", () => {
    expect(adiadoPara(retorno("2026-10-20"), undefined, HOJE, 7)).toBe("2026-10-27");
    expect(adiadoPara(retorno(HOJE), undefined, HOJE, 7)).toBe("2026-10-07");
  });

  it("adiar de novo conta do dia já adiado, passando de mês e de ano", () => {
    expect(adiadoPara(retorno("2026-09-10"), estado({ adiadoAte: "2026-12-20" }), HOJE, 15)).toBe("2027-01-04");
  });
});
