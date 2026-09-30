// Os alertas da anamnese: avisos curtos derivados das respostas. Cada um só repete o que o paciente
// respondeu ("Alergia informada: penicilina", "Gestante"); nenhum decide tratamento, dose ou
// contraindicação — o que fazer com o aviso é do profissional. Gera alerta o "sim" a uma pergunta de saúde,
// de medicamento ou de alergia; hábitos, histórico odontológico e respostas de texto não geram.

import type { PerguntaId, Respostas } from "./questionario";

type Regra = {
  pergunta: PerguntaId;
  /** O que o alerta diz quando a resposta é "sim". */
  texto: string;
  /** Se o detalhe respondido entra no alerta, depois de dois-pontos. */
  comDetalhe?: boolean;
};

const REGRAS: readonly Regra[] = [
  { pergunta: "alergia", texto: "Alergia informada", comDetalhe: true },
  { pergunta: "reacaoAnestesia", texto: "Reação a anestesia informada", comDetalhe: true },
  { pergunta: "anticoagulante", texto: "Usa anticoagulante", comDetalhe: true },
  { pergunta: "gestante", texto: "Gestante" },
  { pergunta: "diabetes", texto: "Diabetes informado" },
  { pergunta: "hipertensao", texto: "Pressão alta informada" },
  { pergunta: "problemaCardiaco", texto: "Problema cardíaco informado", comDetalhe: true },
];

/**
 * Os alertas de uma anamnese, um por pergunta respondida "sim", na ordem da lista acima. O detalhe entra
 * (aparado) só nas perguntas que o mostram e só quando foi informado; o de uma resposta "não" nunca entra.
 * Pergunta sem resposta e resposta de texto não geram alerta.
 */
export function alertasDaAnamnese(respostas: Respostas): string[] {
  return REGRAS.flatMap(({ pergunta, texto, comDetalhe }) => {
    const resposta = respostas[pergunta];
    if (typeof resposta !== "object" || !resposta.sim) return [];
    const detalhe = comDetalhe ? resposta.detalhe?.trim() : undefined;
    return [detalhe ? `${texto}: ${detalhe}` : texto];
  });
}
