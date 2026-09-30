import type { Clinica, Paciente } from "@/dominio";

import { cadeiras, clinica, CLINICA_ID, pacientes, profissionais } from "./colecoes";

/**
 * Quem planta os dados de demonstração de uma parte do app. Roda UMA vez por `versao` e só
 * preenche coleção vazia: nunca apaga nem sobrescreve o que o usuário já mudou. Um módulo
 * registra o seu em `src/modulos/<modulo>/sementes.ts` (`export const semeador`).
 */
export type Semeador = { chave: string; versao: number; semear: () => void };

/** Tudo aqui é fictício (ADR-001): nenhum CPF, telefones com DDD 00, que não existe. */
const PACIENTES: Paciente[] = [
  { id: "pac-exemplo", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "(00) 90000-0001", email: "paciente@exemplo.com", convenio: "Particular" },
  { id: "pac-ana", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002", convenio: "Convênio Exemplo" },
  { id: "pac-carlos", nome: "Carlos Eduardo Lima", nascimento: "1978-09-21", telefone: "(00) 90000-0003", convenio: "Particular" },
  { id: "pac-helena", nome: "Helena Duarte", nascimento: "1996-12-30", telefone: "(00) 90000-0004", convenio: "Convênio Exemplo" },
  { id: "pac-joao", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005", convenio: "Particular" },
  { id: "pac-luisa", nome: "Luísa Fernandes", nascimento: "2011-03-02", telefone: "(00) 90000-0006", convenio: "Convênio Exemplo" },
  { id: "pac-marina", nome: "Marina Costa", nascimento: "2001-07-08", telefone: "(00) 90000-0007", convenio: "Particular" },
  { id: "pac-sebastiao", nome: "Sebastião Ribeiro", nascimento: "1952-11-20", telefone: "(00) 90000-0008", convenio: "Particular" },
];

const manha = { inicio: "08:00", fim: "12:00" };
const tarde = { inicio: "13:30", fim: "18:00" };
const CLINICA: Clinica = {
  id: CLINICA_ID,
  nome: "Clínica Exemplo",
  expediente: { 0: [], 1: [manha, tarde], 2: [manha, tarde], 3: [manha, tarde], 4: [manha, tarde], 5: [manha, tarde], 6: [manha] },
};

/** Clínica, equipe, cadeiras e pacientes: o mínimo para qualquer tela ter o que mostrar. */
export const semeadorDoNucleo: Semeador = {
  chave: "nucleo",
  versao: 1,
  semear: () => {
    if (clinica.listar().length === 0) clinica.substituirTudo([CLINICA]);
    if (profissionais.listar().length === 0) {
      profissionais.substituirTudo([
        { id: "prof-exemplo", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" },
        { id: "prof-exemplo-2", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#4a6fa5" },
      ]);
    }
    if (cadeiras.listar().length === 0) {
      cadeiras.substituirTudo([
        { id: "cadeira-1", nome: "Cadeira 1" },
        { id: "cadeira-2", nome: "Cadeira 2" },
      ]);
    }
    if (pacientes.listar().length === 0) pacientes.substituirTudo(PACIENTES);
  },
};

const chaveDaMarca = (s: Semeador) => `arcada:sementes:${s.chave}`;

/** Roda cada semeador que ainda não rodou nesta versão. Seguro de chamar a cada carga do app. */
export function carregarSementes(semeadores: Semeador[]): void {
  for (const s of semeadores) {
    let marca: string | null = null;
    try {
      marca = globalThis.localStorage?.getItem(chaveDaMarca(s)) ?? null;
    } catch {
      /* storage bloqueado: semeia de novo nesta carga — as coleções também estão em memória. */
    }
    if (marca === String(s.versao)) continue;
    s.semear();
    try {
      globalThis.localStorage?.setItem(chaveDaMarca(s), String(s.versao));
    } catch {
      /* idem */
    }
  }
}
