import { beforeEach, describe, expect, it } from "vitest";

import { pacientes } from "@/dados/colecoes";

import { formatarCpf } from "./cpf";
import {
  cadastrarPaciente,
  DADOS_EM_BRANCO,
  LIMITES,
  montarPaciente,
  validarPaciente,
  type DadosPaciente,
} from "./regras";

const HOJE = "2026-09-30";
const MINIMOS: DadosPaciente = { ...DADOS_EM_BRANCO, nome: "Paciente Exemplo", nascimento: "1990-06-12" };
const com = (campos: Partial<DadosPaciente>): DadosPaciente => ({ ...MINIMOS, ...campos });

/** Dígito verificador (módulo 11), calculado aqui: nenhum CPF escrito à mão. */
const dv = (base: number[]) => {
  const resto = base.reduce((soma, n, i) => soma + n * (base.length + 1 - i), 0) % 11;
  return resto < 2 ? 0 : 11 - resto;
};
function cpfDe(nove: string): string {
  const n = Array.from(nove, Number);
  n.push(dv(n));
  n.push(dv(n));
  return n.join("");
}
const CPF = cpfDe("246813579");

describe("validarPaciente", () => {
  it("só nome e nascimento são obrigatórios", () => {
    expect(validarPaciente(MINIMOS, HOJE)).toEqual({});
    expect(Object.keys(validarPaciente(DADOS_EM_BRANCO, HOJE))).toEqual(["nome", "nascimento"]);
  });

  it("recusa nome em branco ou passando do limite", () => {
    expect(validarPaciente(com({ nome: "   " }), HOJE).nome).toBeTruthy();
    expect(validarPaciente(com({ nome: "a".repeat(LIMITES.nome) }), HOJE).nome).toBeUndefined();
    expect(validarPaciente(com({ nome: "a".repeat(LIMITES.nome + 1) }), HOJE).nome).toBeTruthy();
  });

  it("nascimento: existe no calendário, não é futuro e não é antigo demais", () => {
    const erro = (nascimento: string) => validarPaciente(com({ nascimento }), HOJE).nascimento;
    expect(erro("2001-02-30")).toBeTruthy();
    expect(erro("2023-02-29")).toBeTruthy(); // ano não bissexto
    expect(erro("2024-02-29")).toBeUndefined();
    expect(erro("2026-13-01")).toBeTruthy();
    expect(erro("30/09/2026")).toBeTruthy();
    expect(erro("1899-12-31")).toBeTruthy();
    expect(erro("1900-01-01")).toBeUndefined();
    expect(erro("2026-10-01")).toBe("A data de nascimento não pode ser no futuro.");
    expect(erro(HOJE)).toBeUndefined(); // nasceu hoje
  });

  it("CPF é opcional, mas se vier tem de ser válido, com ou sem máscara", () => {
    const erro = (cpf: string) => validarPaciente(com({ cpf }), HOJE).cpf;
    expect(erro("")).toBeUndefined();
    expect(erro(CPF)).toBeUndefined();
    expect(erro(formatarCpf(CPF))).toBeUndefined();
    expect(erro(CPF.slice(0, 10) + ((Number(CPF[10]) + 1) % 10))).toBeTruthy(); // último dígito trocado
    expect(erro("11111111111")).toBeTruthy();
    expect(erro("123")).toBeTruthy();
  });

  it("telefone: o que os botões de contato aceitam (DDD + número), ou em branco", () => {
    const erro = (telefone: string) => validarPaciente(com({ telefone }), HOJE).telefone;
    expect(erro("")).toBeUndefined();
    expect(erro("(11) 90000-0001")).toBeUndefined();
    expect(erro("+55 (11) 3333-4444")).toBeUndefined();
    expect(erro("90000-0001")).toBeTruthy(); // sem DDD
    expect(erro("abc")).toBeTruthy();
  });

  it("e-mail em branco ou no formato usuario@dominio.tld", () => {
    const erro = (email: string) => validarPaciente(com({ email }), HOJE).email;
    expect(erro("")).toBeUndefined();
    expect(erro(" paciente@exemplo.com ")).toBeUndefined();
    expect(erro("paciente")).toBeTruthy();
    expect(erro("paciente@exemplo")).toBeTruthy();
    expect(erro("pac iente@exemplo.com")).toBeTruthy();
  });

  it("convênio e observações têm teto de tamanho", () => {
    expect(validarPaciente(com({ convenio: "c".repeat(LIMITES.convenio + 1) }), HOJE).convenio).toBeTruthy();
    expect(validarPaciente(com({ observacoes: "o".repeat(LIMITES.observacoes + 1) }), HOJE).observacoes).toBeTruthy();
    expect(validarPaciente(com({ convenio: "c".repeat(LIMITES.convenio) }), HOJE)).toEqual({});
  });

  it("as mensagens não repetem o que foi digitado", () => {
    const digitado = com({ cpf: "11111111111", telefone: "abc", email: "sem-arroba" });
    const texto = Object.values(validarPaciente(digitado, HOJE)).join(" ");
    for (const valor of ["11111111111", "abc", "sem-arroba"]) expect(texto).not.toContain(valor);
  });
});

describe("montarPaciente", () => {
  it("guarda o texto aparado, o CPF só com dígitos e Particular quando falta convênio", () => {
    const p = montarPaciente(
      com({ nome: "  Paciente   Exemplo ", cpf: formatarCpf(CPF), telefone: " (11) 90000-0001 ", email: " paciente@exemplo.com " }),
      "id-1",
    );
    expect(p).toEqual({
      id: "id-1",
      nome: "Paciente Exemplo",
      nascimento: "1990-06-12",
      telefone: "(11) 90000-0001",
      cpf: CPF,
      email: "paciente@exemplo.com",
      convenio: "Particular",
    });
  });

  it("campo opcional em branco fica ausente, e não como texto vazio", () => {
    const p = montarPaciente(MINIMOS, "id-1");
    expect(Object.keys(p).sort()).toEqual(["convenio", "id", "nascimento", "nome", "telefone"]);
    expect(p.telefone).toBe("");
    expect(montarPaciente(com({ observacoes: "  Prefere o fim da tarde.\n" }), "id-1").observacoes).toBe("Prefere o fim da tarde.");
  });

  it("mantém o convênio informado", () => {
    expect(montarPaciente(com({ convenio: " Convênio Exemplo " }), "id-1").convenio).toBe("Convênio Exemplo");
  });
});

describe("cadastrarPaciente", () => {
  beforeEach(() => pacientes.substituirTudo([]));

  it("valida, monta e grava na coleção, devolvendo o paciente com id novo", () => {
    const p = cadastrarPaciente(com({ nome: "Paciente  Exemplo" }), HOJE);

    expect(p.id).toBeTruthy();
    expect(p.nome).toBe("Paciente Exemplo");
    expect(pacientes.obter(p.id)).toEqual(p);
    expect(pacientes.listar()).toHaveLength(1);
  });

  it("dá ids diferentes a cada cadastro", () => {
    expect(cadastrarPaciente(MINIMOS, HOJE).id).not.toBe(cadastrarPaciente(MINIMOS, HOJE).id);
  });

  it("dado inválido lança, nomeia os campos e não grava nada", () => {
    expect(() => cadastrarPaciente(com({ nome: "", cpf: "11111111111" }), HOJE)).toThrow("Paciente inválido: nome, cpf.");
    expect(pacientes.listar()).toHaveLength(0);
  });
});
