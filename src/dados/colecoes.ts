import type { Cadeira, Clinica, Consulta, Lancamento, Paciente, PlanoTratamento, Procedimento, Profissional } from "@/dominio";

import { criarColecao } from "./colecao";

// As coleções do núcleo: as entidades que mais de um módulo lê. Dado que só um módulo usa
// (anamnese, odontograma, exame periodontal) mora em `src/modulos/<modulo>/dados.ts`.
// Uma instância por nome, aqui — duas do mesmo nome não se enxergam na mesma aba.

/** A clínica é um registro só, de id `CLINICA_ID`. */
export const CLINICA_ID = "clinica";
export const clinica = criarColecao<Clinica>("clinica");
export const profissionais = criarColecao<Profissional>("profissionais");
export const cadeiras = criarColecao<Cadeira>("cadeiras");
export const pacientes = criarColecao<Paciente>("pacientes");
export const procedimentos = criarColecao<Procedimento>("procedimentos");
export const consultas = criarColecao<Consulta>("consultas");
export const planos = criarColecao<PlanoTratamento>("planos");
export const lancamentos = criarColecao<Lancamento>("lancamentos");
