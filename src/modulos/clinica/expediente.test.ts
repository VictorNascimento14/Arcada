import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Expediente } from "@/dominio";

import { camposDoExpediente, salvarExpediente, validarDia, validarExpediente, type CamposDoDia, type CamposDoExpediente } from "./expediente";

const faixa = (inicio: string, fim: string) => ({ inicio, fim });
const MANHA = faixa("08:00", "12:00");
const TARDE = faixa("13:30", "18:00");
const EXPEDIENTE: Expediente = { 0: [], 1: [MANHA, TARDE], 2: [faixa("09:00", "17:00")], 3: [], 4: [], 5: [], 6: [MANHA] };

const CORRIDO: CamposDoDia = { aberto: true, abertura: "08:00", fechamento: "18:00", intervaloInicio: "", intervaloFim: "" };
const COM_ALMOCO: CamposDoDia = { ...CORRIDO, intervaloInicio: "12:00", intervaloFim: "13:30" };
const semana = (parcial: Partial<CamposDoExpediente>): CamposDoExpediente => ({ ...camposDoExpediente(), ...parcial });

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", cidade: "Cidade Exemplo", expediente: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } }]);
});

describe("camposDoExpediente", () => {
  it("mostra cada dia: com intervalo, corrido ou fechado", () => {
    const campos = camposDoExpediente(EXPEDIENTE);

    expect(campos[1]).toEqual(COM_ALMOCO);
    expect(campos[2]).toEqual({ ...CORRIDO, abertura: "09:00", fechamento: "17:00" });
    expect(campos[0].aberto).toBe(false);
  });

  it("não depende da ordem em que as faixas foram gravadas", () => {
    expect(camposDoExpediente({ ...EXPEDIENTE, 1: [TARDE, MANHA] })[1]).toEqual(COM_ALMOCO);
  });

  it("sem clínica, a semana toda fechada, já com um horário sugerido para quando o dia for aberto", () => {
    const campos = camposDoExpediente();

    expect(Object.values(campos).every((d) => !d.aberto)).toBe(true);
    expect(campos[3]).toMatchObject({ abertura: "08:00", fechamento: "18:00", intervaloInicio: "", intervaloFim: "" });
  });
});

describe("validarDia", () => {
  it("aceita o dia corrido, o dia com intervalo e o dia fechado, mesmo com o resto em branco", () => {
    expect(validarDia(CORRIDO)).toEqual({});
    expect(validarDia(COM_ALMOCO)).toEqual({});
    expect(validarDia({ aberto: false, abertura: "", fechamento: "lixo", intervaloInicio: "12:00", intervaloFim: "" })).toEqual({});
  });

  it("exige HH:mm com hora de 00 a 23 e minuto de 00 a 59", () => {
    for (const ruim of ["", "8:00", "24:00", "12:60", "08h00", "08:00:00"]) {
      expect(validarDia({ ...CORRIDO, abertura: ruim }).abertura, `abertura "${ruim}"`).toBeTruthy();
      expect(validarDia({ ...CORRIDO, fechamento: ruim }).fechamento, `fechamento "${ruim}"`).toBeTruthy();
    }
    expect(validarDia({ ...CORRIDO, abertura: "00:00", fechamento: "23:59" })).toEqual({});
  });

  it("exige o fechamento depois da abertura: igual ou antes reprova, um minuto depois passa", () => {
    expect(validarDia({ ...CORRIDO, fechamento: "08:00" }).fechamento).toBeTruthy();
    expect(validarDia({ ...CORRIDO, fechamento: "07:59" }).fechamento).toBeTruthy();
    expect(validarDia({ ...CORRIDO, fechamento: "08:01" })).toEqual({});
  });

  it("o intervalo tem os dois horários ou nenhum, e termina depois de começar", () => {
    expect(validarDia({ ...CORRIDO, intervaloInicio: "12:00" }).intervalo).toBeTruthy();
    expect(validarDia({ ...CORRIDO, intervaloFim: "13:00" }).intervalo).toBeTruthy();
    expect(validarDia({ ...CORRIDO, intervaloInicio: "12:00", intervaloFim: "25:00" }).intervalo).toBeTruthy();
    expect(validarDia({ ...CORRIDO, intervaloInicio: "13:00", intervaloFim: "12:00" }).intervalo).toBeTruthy();
    expect(validarDia({ ...CORRIDO, intervaloInicio: "12:00", intervaloFim: "12:00" }).intervalo).toBeTruthy();
  });

  it("o intervalo cai dentro do dia, sem encostar na abertura nem no fechamento", () => {
    const com = (intervaloInicio: string, intervaloFim: string) => validarDia({ ...CORRIDO, intervaloInicio, intervaloFim }).intervalo;

    expect(com("07:00", "09:00")).toBeTruthy(); // começa antes de abrir
    expect(com("08:00", "09:00")).toBeTruthy(); // começa junto com a abertura: a primeira faixa ficaria vazia
    expect(com("17:00", "18:00")).toBeTruthy(); // termina junto com o fechamento
    expect(com("17:00", "19:00")).toBeTruthy(); // termina depois de fechar
    expect(com("08:01", "17:59")).toBeUndefined();
  });

  it("não mede o intervalo contra um horário que já está errado", () => {
    expect(validarDia({ ...COM_ALMOCO, fechamento: "07:00" })).toEqual({ fechamento: expect.any(String) });
  });
});

describe("validarExpediente", () => {
  it("devolve só os dias com erro, pela chave do dia da semana", () => {
    const erros = validarExpediente(semana({ 1: CORRIDO, 3: { ...CORRIDO, fechamento: "07:00" }, 0: { ...CORRIDO, abertura: "" } }));

    expect(Object.keys(erros).sort()).toEqual(["0", "3"]);
    expect(erros[3]?.fechamento).toBeTruthy();
    expect(erros[0]?.abertura).toBeTruthy();
  });
});

describe("salvarExpediente", () => {
  it("grava uma faixa para o dia corrido, duas para o dia com intervalo e nenhuma para o fechado, sem tocar no resto da clínica", () => {
    const erros = salvarExpediente(semana({ 1: COM_ALMOCO, 2: { ...CORRIDO, abertura: "09:00", fechamento: "17:00" }, 6: { ...CORRIDO, fechamento: "12:00" } }));

    expect(erros).toEqual({});
    expect(clinica.obter(CLINICA_ID)).toEqual({
      id: CLINICA_ID,
      nome: "Clínica Exemplo",
      cidade: "Cidade Exemplo",
      expediente: { 0: [], 1: [MANHA, TARDE], 2: [faixa("09:00", "17:00")], 3: [], 4: [], 5: [], 6: [MANHA] },
    });
    expect(clinica.listar()).toHaveLength(1);
  });

  it("abrir o expediente e salvar sem mexer não muda nada", () => {
    salvarExpediente(camposDoExpediente(EXPEDIENTE));

    expect(clinica.obter(CLINICA_ID)!.expediente).toEqual(EXPEDIENTE);
  });

  it("com erro, devolve as mensagens por dia e não grava nada, nem os dias que estavam certos", () => {
    const erros = salvarExpediente(semana({ 1: COM_ALMOCO, 2: { ...CORRIDO, fechamento: "08:00" } }));

    expect(Object.keys(erros)).toEqual(["2"]);
    expect(clinica.obter(CLINICA_ID)!.expediente[1]).toEqual([]);
  });

  it("sem o registro da clínica, cria um só com o expediente", () => {
    clinica.substituirTudo([]);

    expect(salvarExpediente(semana({ 1: CORRIDO }))).toEqual({});
    expect(clinica.obter(CLINICA_ID)?.expediente[1]).toEqual([faixa("08:00", "18:00")]);
  });
});
