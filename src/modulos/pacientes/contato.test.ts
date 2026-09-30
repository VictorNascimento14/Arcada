import { describe, expect, it } from "vitest";

import { linkTelefone, linkWhatsApp } from "./contato";

// Números de sequência óbvia, sem ligação com pessoa.
const CELULAR = "5511912345678";

describe("telefone do jeito que se digita", () => {
  it.each(["(11) 91234-5678", "11912345678", "  11 91234 5678  ", "+55 (11) 91234-5678", "5511912345678", "(011) 91234-5678", "+55 (011) 91234-5678"])(
    "%j vira o mesmo número, sem duplicar o 55",
    (telefone) => {
      expect(linkWhatsApp(telefone)).toBe(`https://wa.me/${CELULAR}`);
      expect(linkTelefone(telefone)).toBe(`tel:+${CELULAR}`);
    },
  );

  it("aceita o fixo de 8 dígitos, com e sem o código do país", () => {
    expect(linkWhatsApp("(11) 2345-6789")).toBe("https://wa.me/551123456789");
    expect(linkWhatsApp("+55 11 2345-6789")).toBe("https://wa.me/551123456789");
    expect(linkTelefone("+55 11 2345-6789")).toBe("tel:+551123456789");
  });

  it("não confunde o DDD 55 com o código do país", () => {
    for (const telefone of ["(55) 91234-5678", "+55 (55) 91234-5678", "(055) 91234-5678"]) {
      expect(linkWhatsApp(telefone), telefone).toBe("https://wa.me/5555912345678");
    }
  });

  it.each(["", "abc", "12345", "9 1234-5678", "11 91234-56789", "+351 912 345 678"])(
    "%j não é número brasileiro de 10 ou 11 dígitos: nenhum link",
    (telefone) => {
      expect(linkWhatsApp(telefone)).toBeNull();
      expect(linkTelefone(telefone)).toBeNull();
    },
  );
});

describe("linkWhatsApp: texto", () => {
  it("leva o texto codificado", () => {
    expect(linkWhatsApp("(11) 91234-5678", "Olá, Paciente Exemplo! Confirma a consulta?")).toBe(
      `https://wa.me/${CELULAR}?text=Ol%C3%A1%2C%20Paciente%20Exemplo!%20Confirma%20a%20consulta%3F`,
    );
  });

  it("devolve o texto inteiro mesmo com o que quebraria a URL", () => {
    const texto = "a&b=c#d?e\nf";
    const url = new URL(linkWhatsApp("11912345678", texto) ?? "");
    expect(url.searchParams.get("text")).toBe(texto);
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.hash).toBe("");
  });

  it("sem texto, sem ?text=", () => {
    expect(linkWhatsApp("11912345678")).toBe(`https://wa.me/${CELULAR}`);
    expect(linkWhatsApp("11912345678", "")).toBe(`https://wa.me/${CELULAR}`);
  });

  it("telefone que não serve não leva o texto a lugar nenhum", () => {
    expect(linkWhatsApp("12345", "Olá")).toBeNull();
  });
});
