import { beforeEach, describe, expect, it } from "vitest";

import { cadeiras, consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import type { Cadeira, Clinica, Consulta, Paciente, Procedimento, Profissional } from "@/dominio";

import {
  camposDaMarcacao,
  DURACAO_MAX,
  DURACAO_MIN,
  horariosSugeridos,
  marcarConsulta,
  restricoesDaAgenda,
  textoDoAviso,
  textoDoBloqueio,
  validarMarcacao,
  type CamposDaMarcacao,
} from "./marcar";

// Tudo fictício: telefones com DDD 00, que não existe; nenhum CPF.
const PACIENTES: Paciente[] = [
  { id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" },
  { id: "a2", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005" },
];
const PROFISSIONAIS: Profissional[] = [
  { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" },
  { id: "p2", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#4a6fa5" },
  { id: "p3", nome: "Dr. Inativo", cro: "CRO-SP 00002", cor: "#a55", ativo: false },
];
const CADEIRAS: Cadeira[] = [
  { id: "c1", nome: "Cadeira 1" },
  { id: "c2", nome: "Cadeira 2" },
  { id: "c3", nome: "Cadeira 3", ativa: false },
];
const proc = (id: string, ativo: boolean): Procedimento => ({
  id, nome: id, especialidade: "Prevenção", preco: 10000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo,
});

/** Quinta-feira, 1º de outubro de 2026: dia útil, sem feriado. A Ana ocupa a Cadeira 1 com a Dra. das 09:00 às 09:45. */
const EXISTENTE: Consulta = { id: "k1", pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-10-01T09:00", duracaoMin: 45, situacao: "agendada" };
const CAMPOS: CamposDaMarcacao = { pacienteId: "a2", profissionalId: "p2", cadeiraId: "c2", procedimentoId: "", dia: "2026-10-01", hora: "10:00", duracaoMin: "30" };
const com = (extra: Partial<CamposDaMarcacao>): CamposDaMarcacao => ({ ...CAMPOS, ...extra });

const MANHA = { inicio: "08:00", fim: "12:00" };
const TARDE = { inicio: "13:30", fim: "18:00" };
const EXPEDIENTE: Clinica["expediente"] = { 0: [], 1: [MANHA, TARDE], 2: [MANHA, TARDE], 3: [MANHA, TARDE], 4: [MANHA, TARDE], 5: [MANHA, TARDE], 6: [MANHA] };

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo(PACIENTES);
  profissionais.substituirTudo(PROFISSIONAIS);
  cadeiras.substituirTudo(CADEIRAS);
  procedimentos.substituirTudo([proc("pr1", true), proc("pr2", false)]);
  consultas.substituirTudo([EXISTENTE]);
});

describe("validarMarcacao", () => {
  it("aceita o formulário completo", () => {
    expect(validarMarcacao(CAMPOS)).toEqual({});
  });

  it("exige paciente, profissional, cadeira, data e início", () => {
    const erros = validarMarcacao(camposDaMarcacao(""));

    expect(Object.keys(erros).sort()).toEqual(["cadeiraId", "dia", "hora", "pacienteId", "profissionalId"]);
    expect(erros.pacienteId).toBe("Escolha o paciente.");
    expect(erros.hora).toBe("Informe o horário de início.");
  });

  it("a duração é um inteiro de 5 a 480 minutos", () => {
    expect(validarMarcacao(com({ duracaoMin: String(DURACAO_MIN) }))).toEqual({});
    expect(validarMarcacao(com({ duracaoMin: String(DURACAO_MAX) }))).toEqual({});
    for (const ruim of ["", "4", "481", "abc", "30.5", "-30", "1e2"]) {
      expect(validarMarcacao(com({ duracaoMin: ruim })).duracaoMin, ruim).toBeTruthy();
    }
  });

  it("recusa data que não existe e início fora de HH:mm", () => {
    expect(validarMarcacao(com({ dia: "2026-02-30" })).dia).toBeTruthy();
    expect(validarMarcacao(com({ dia: "01/10/2026" })).dia).toBeTruthy();
    expect(validarMarcacao(com({ hora: "24:00" })).hora).toBeTruthy();
    expect(validarMarcacao(com({ hora: "9:00" })).hora).toBeTruthy();
  });

  it("a consulta não passa da meia-noite", () => {
    expect(validarMarcacao(com({ hora: "23:00", duracaoMin: "60" }))).toEqual({});
    expect(validarMarcacao(com({ hora: "23:30", duracaoMin: "60" })).duracaoMin).toBe("A consulta não pode passar da meia-noite.");
  });
});

describe("restricoesDaAgenda", () => {
  const conflitos = (c: CamposDaMarcacao) => restricoesDaAgenda(c, consultas.listar()).bloqueios;

  it("horário livre não tem bloqueio nem aviso", () => {
    expect(restricoesDaAgenda(CAMPOS, consultas.listar())).toEqual({ bloqueios: [], aviso: undefined });
  });

  it("a mesma cadeira ocupada bloqueia, mesmo com outro profissional", () => {
    const [b] = conflitos(com({ cadeiraId: "c1", hora: "09:15" }));
    expect(b).toMatchObject({ tipo: "conflito", conflito: { motivos: ["cadeira"] } });
  });

  it("o mesmo profissional ocupado bloqueia, mesmo em outra cadeira", () => {
    const [b] = conflitos(com({ profissionalId: "p1", hora: "09:15" }));
    expect(b).toMatchObject({ tipo: "conflito", conflito: { motivos: ["profissional"] } });
  });

  it("cadeira e profissional ao mesmo tempo dão um bloqueio com os dois motivos", () => {
    const b = conflitos(com({ cadeiraId: "c1", profissionalId: "p1", hora: "09:00" }));
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ conflito: { motivos: ["cadeira", "profissional"], consulta: { id: "k1" } } });
  });

  it("encostar não é conflito, nem antes nem depois", () => {
    expect(conflitos(com({ cadeiraId: "c1", profissionalId: "p1", hora: "09:45" }))).toEqual([]);
    expect(conflitos(com({ cadeiraId: "c1", profissionalId: "p1", hora: "08:30", duracaoMin: "30" }))).toEqual([]);
  });

  it("a cancelada libera o horário, a que faltou continua ocupando, e o outro dia não conta", () => {
    const igual = com({ cadeiraId: "c1", profissionalId: "p1", hora: "09:00" });
    consultas.salvar({ ...EXISTENTE, situacao: "cancelada" });
    expect(conflitos(igual)).toEqual([]);
    consultas.salvar({ ...EXISTENTE, situacao: "faltou" });
    expect(conflitos(igual)).toHaveLength(1);
    expect(conflitos({ ...igual, dia: "2026-10-02" })).toEqual([]);
  });

  it("feriado nacional bloqueia", () => {
    const { bloqueios, aviso } = restricoesDaAgenda(com({ dia: "2026-09-07" }), []);

    expect(bloqueios).toEqual([{ tipo: "feriado", feriado: { dia: "2026-09-07", nome: "Independência do Brasil", tipo: "feriado" } }]);
    expect(aviso).toBeUndefined();
  });

  it("ponto facultativo só avisa", () => {
    const { bloqueios, aviso } = restricoesDaAgenda(com({ dia: "2026-02-17" }), []);

    expect(bloqueios).toEqual([]);
    expect(aviso).toMatchObject({ nome: "Carnaval", tipo: "facultativo" });
  });

  it("com o formulário pela metade, olha o feriado e não inventa conflito", () => {
    expect(restricoesDaAgenda(com({ dia: "2026-09-07", hora: "", cadeiraId: "" }), consultas.listar()).bloqueios).toHaveLength(1);
    expect(conflitos(com({ cadeiraId: "c1", profissionalId: "p1", hora: "" }))).toEqual([]);
    expect(conflitos(com({ cadeiraId: "c1", profissionalId: "", hora: "09:00" }))).toEqual([]);
  });
});

describe("horariosSugeridos", () => {
  const sugeridos = (c: CamposDaMarcacao) => horariosSugeridos(c, consultas.listar(), EXPEDIENTE);

  it("tira os inícios que sobrepõem a consulta da cadeira, e deixa os que encostam", () => {
    const livres = sugeridos(com({ cadeiraId: "c1", profissionalId: "", duracaoMin: "30" }));

    expect(livres).toContain("08:30"); // termina às 09:00, quando a outra começa
    expect(livres).toContain("09:45");
    for (const h of ["08:45", "09:00", "09:15", "09:30"]) expect(livres, h).not.toContain(h);
  });

  it("o profissional ocupado tira os mesmos horários, em qualquer cadeira", () => {
    const livres = sugeridos(com({ cadeiraId: "", profissionalId: "p1", duracaoMin: "30" }));

    expect(livres).not.toContain("09:00");
    expect(livres).toContain("09:45");
  });

  it("uma cadeira livre e um profissional livre sobram com o expediente inteiro", () => {
    expect(sugeridos(com({ duracaoMin: "30" }))[0]).toBe("08:00");
  });

  it("sem cadeira nem profissional, sem duração válida, em feriado e em dia fechado não sugere nada", () => {
    expect(sugeridos(com({ cadeiraId: "", profissionalId: "" }))).toEqual([]);
    expect(sugeridos(com({ duracaoMin: "" }))).toEqual([]);
    expect(sugeridos(com({ dia: "2026-09-07" }))).toEqual([]);
    expect(sugeridos(com({ dia: "2026-10-04" }))).toEqual([]); // domingo
  });
});

describe("marcarConsulta", () => {
  it("grava a consulta como agendada, com o início juntando dia e hora e a duração em número", () => {
    const r = marcarConsulta(CAMPOS);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.consulta).toMatchObject({ pacienteId: "a2", profissionalId: "p2", cadeiraId: "c2", inicio: "2026-10-01T10:00", duracaoMin: 30, situacao: "agendada" });
    expect(r.consulta.id).toBeTruthy();
    expect(r.consulta).not.toHaveProperty("procedimentoId");
    expect(consultas.obter(r.consulta.id)).toEqual(r.consulta);
    expect(consultas.listar()).toHaveLength(2);
  });

  it("guarda o procedimento quando um foi escolhido", () => {
    const r = marcarConsulta(com({ procedimentoId: "pr1" }));

    expect(r.ok && r.consulta.procedimentoId).toBe("pr1");
  });

  it("não grava quando falta campo, e devolve o erro de cada um", () => {
    const r = marcarConsulta(com({ pacienteId: "", hora: "" }));

    expect(r).toMatchObject({ ok: false, erros: { pacienteId: expect.any(String), hora: expect.any(String) }, bloqueios: [] });
    expect(consultas.listar()).toEqual([EXISTENTE]);
  });

  it("não grava em cima de outra consulta nem no feriado, e diz o bloqueio", () => {
    const conflito = marcarConsulta(com({ cadeiraId: "c1", hora: "09:30" }));
    const feriado = marcarConsulta(com({ dia: "2026-09-07" }));

    expect(conflito).toMatchObject({ ok: false, bloqueios: [{ tipo: "conflito" }] });
    expect(feriado).toMatchObject({ ok: false, bloqueios: [{ tipo: "feriado" }] });
    expect(consultas.listar()).toEqual([EXISTENTE]);
  });

  it("no ponto facultativo grava mesmo assim", () => {
    expect(marcarConsulta(com({ dia: "2026-02-17" })).ok).toBe(true);
  });

  it("recusa quem não existe ou está inativo", () => {
    expect(marcarConsulta(com({ pacienteId: "sumiu" }))).toMatchObject({ ok: false, erros: { pacienteId: expect.any(String) } });
    expect(marcarConsulta(com({ profissionalId: "p3" }))).toMatchObject({ ok: false, erros: { profissionalId: "Escolha um profissional ativo." } });
    expect(marcarConsulta(com({ cadeiraId: "c3" }))).toMatchObject({ ok: false, erros: { cadeiraId: "Escolha uma cadeira ativa." } });
    expect(marcarConsulta(com({ procedimentoId: "pr2" }))).toMatchObject({ ok: false, erros: { procedimentoId: "Escolha um procedimento ativo." } });
    expect(consultas.listar()).toEqual([EXISTENTE]);
  });
});

describe("textos", () => {
  const nomes = { cadeira: "Cadeira 1", profissional: "Dra. Exemplo", paciente: "Ana Beatriz Moura" };
  const conflito = (motivos: ("cadeira" | "profissional")[]) => textoDoBloqueio({ tipo: "conflito", conflito: { consulta: EXISTENTE, motivos } }, nomes);

  it("o conflito diz quem está ocupado, o horário e o paciente", () => {
    expect(conflito(["cadeira"])).toBe("Cadeira 1 já tem consulta das 09:00 às 09:45 (Ana Beatriz Moura). Escolha outro horário.");
    expect(conflito(["profissional"])).toBe("Dra. Exemplo já tem consulta das 09:00 às 09:45 (Ana Beatriz Moura). Escolha outro horário.");
    expect(conflito(["cadeira", "profissional"])).toBe("Cadeira 1 e Dra. Exemplo já têm consulta das 09:00 às 09:45 (Ana Beatriz Moura). Escolha outro horário.");
  });

  it("o feriado e o ponto facultativo dizem o nome do dia", () => {
    const feriado = { dia: "2026-09-07", nome: "Independência do Brasil", tipo: "feriado" as const };

    expect(textoDoBloqueio({ tipo: "feriado", feriado }, nomes)).toBe("Independência do Brasil é feriado nacional. A agenda não marca consulta nesse dia: escolha outra data.");
    expect(textoDoAviso({ dia: "2026-02-17", nome: "Carnaval", tipo: "facultativo" })).toBe("Carnaval é ponto facultativo. Confirme se a clínica abre nesse dia antes de marcar.");
  });
});
