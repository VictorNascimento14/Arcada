// A coleção `anamneses`, dado só deste módulo: cada salvamento grava uma VERSÃO nova da anamnese do paciente,
// com o dia em que foi gravada. Nenhuma versão é sobrescrita — a vigente é a mais recente, e as anteriores
// ficam como estavam. A escrita normaliza e valida; a validação da tela é só conforto.

import { criarColecao } from "@/dados/colecao";
import { pacientes } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { DataISO } from "@/dominio";
import { diaISO } from "@/ui";

import { PERGUNTAS, respostasValidas, type Respostas } from "./questionario";

export type Anamnese = {
  id: string;
  pacienteId: string;
  /** O dia em que esta versão foi gravada (`diaISO`). */
  data: DataISO;
  respostas: Respostas;
};

export const anamneses = criarColecao<Anamnese>("anamneses");

/**
 * As versões de um paciente, da mais nova à mais antiga: por data e, no mesmo dia, a última gravada primeiro
 * (a coleção guarda na ordem de entrada, e o `sort` é estável).
 */
export function versoesDoPaciente(todas: readonly Anamnese[], pacienteId: string): Anamnese[] {
  return todas
    .filter((a) => a.pacienteId === pacienteId)
    .reverse()
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

/**
 * As respostas como se guardam, na ordem do questionário: texto aparado e sem o que ficou em branco; detalhe
 * só de um "sim" que aceita detalhe, aparado e sem o em branco — o que se digitou antes de mudar para "não"
 * não vai junto. O que não é do questionário fica de fora.
 */
function limpar(respostas: Respostas): Respostas {
  const bruto: Record<string, unknown> = respostas;
  const limpas: Record<string, unknown> = {};
  for (const p of PERGUNTAS) {
    const r = bruto[p.id];
    if (p.tipo === "texto") {
      if (typeof r === "string" && r.trim()) limpas[p.id] = r.trim();
    } else if (typeof r === "object" && r !== null && "sim" in r && typeof r.sim === "boolean") {
      const detalhe = r.sim && p.detalhe && "detalhe" in r && typeof r.detalhe === "string" ? r.detalhe.trim() : "";
      limpas[p.id] = detalhe ? { sim: r.sim, detalhe } : { sim: r.sim };
    }
  }
  // Só o formato foi acertado aqui; quem confere o conteúdo é `respostasValidas`, logo em seguida.
  return limpas as Respostas;
}

/**
 * Normaliza, valida e grava uma versão nova da anamnese do paciente, datada de hoje. Devolve a versão
 * gravada, ou `null` — sem gravar — se o paciente não existe ou as respostas não servem (pergunta sim/não
 * sem resposta, texto além do limite). Salvar sem mudar nada também grava uma versão: cada salvamento é uma.
 */
export function salvarAnamnese(pacienteId: string, respostas: Respostas): Anamnese | null {
  const limpas = limpar(respostas);
  if (!pacientes.obter(pacienteId) || !respostasValidas(limpas)) return null;
  const versao: Anamnese = { id: novoId(), pacienteId, data: diaISO(new Date()), respostas: limpas };
  anamneses.salvar(versao);
  return versao;
}
