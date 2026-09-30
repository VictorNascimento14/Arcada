import { describe, expect, it } from "vitest";

import { anosDoPaciente, dataBR, rotuloConvenio, rotuloIdade } from "./exibicao";

describe("anosDoPaciente", () => {
  it("conta os anos completos até hoje", () => {
    expect(anosDoPaciente({ nascimento: "1990-06-12" }, "2026-09-30")).toBe(36);
    expect(anosDoPaciente({ nascimento: "1990-12-01" }, "2026-09-30")).toBe(35);
  });

  it("devolve null para nascimento ilegível ou no futuro, em vez de lançar", () => {
    expect(anosDoPaciente({ nascimento: "" }, "2026-09-30")).toBeNull();
    expect(anosDoPaciente({ nascimento: "12/06/1990" }, "2026-09-30")).toBeNull();
    expect(anosDoPaciente({ nascimento: "2027-01-01" }, "2026-09-30")).toBeNull();
  });
});

describe("rotuloIdade", () => {
  it("escreve no singular, no plural e para o bebê que não fez um ano", () => {
    expect(rotuloIdade(0)).toBe("menos de 1 ano");
    expect(rotuloIdade(1)).toBe("1 ano");
    expect(rotuloIdade(36)).toBe("36 anos");
  });
});

describe("rotuloConvenio", () => {
  it("usa o convênio informado e cai em Particular quando falta ou está em branco", () => {
    expect(rotuloConvenio({ convenio: "Convênio Exemplo" })).toBe("Convênio Exemplo");
    expect(rotuloConvenio({ convenio: " Convênio Exemplo " })).toBe("Convênio Exemplo");
    expect(rotuloConvenio({})).toBe("Particular");
    expect(rotuloConvenio({ convenio: "   " })).toBe("Particular");
  });
});

describe("dataBR", () => {
  it("escreve dia/mês/ano e devolve o texto fora do formato como veio", () => {
    expect(dataBR("1990-06-12")).toBe("12/06/1990");
    expect(dataBR("2000-02-29")).toBe("29/02/2000");
    expect(dataBR("")).toBe("");
    expect(dataBR("12/06/1990")).toBe("12/06/1990");
  });
});
