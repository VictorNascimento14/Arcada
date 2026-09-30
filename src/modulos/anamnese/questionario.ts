// O questionário da anamnese: as seções, as perguntas de cada uma e o que se guarda como resposta. A lista é
// fechada, como a das condições do odontograma: o `id` da pergunta é o que fica no dado, e o texto dela pode
// ser reescrito sem mexer no que já foi respondido. As perguntas só colhem o que o paciente conta — nenhuma
// sugere conduta, e nada aqui decide tratamento.

type PerguntaSimNao = {
  id: string;
  rotulo: string;
  tipo: "simNao";
  /** O rótulo do campo de detalhe ("Qual?"). Só a pergunta que o tem aceita detalhe na resposta. */
  detalhe?: string;
};

type PerguntaTexto = { id: string; rotulo: string; tipo: "texto" };

export type Pergunta = PerguntaSimNao | PerguntaTexto;

export type Secao = { id: string; titulo: string; perguntas: readonly Pergunta[] };

export const SECOES = [
  {
    id: "saudeGeral",
    titulo: "Saúde geral",
    perguntas: [
      { id: "tratamentoMedico", rotulo: "Está em tratamento médico?", tipo: "simNao", detalhe: "Qual?" },
      { id: "diabetes", rotulo: "Tem diabetes?", tipo: "simNao" },
      { id: "hipertensao", rotulo: "Tem pressão alta?", tipo: "simNao" },
      { id: "problemaCardiaco", rotulo: "Tem algum problema no coração?", tipo: "simNao", detalhe: "Qual?" },
      { id: "gestante", rotulo: "Está gestante?", tipo: "simNao" },
      { id: "outrosProblemas", rotulo: "Algum outro problema de saúde?", tipo: "texto" },
    ],
  },
  {
    id: "medicamentos",
    titulo: "Medicamentos em uso",
    perguntas: [
      { id: "usaMedicamento", rotulo: "Usa algum medicamento com frequência?", tipo: "simNao", detalhe: "Quais?" },
      { id: "anticoagulante", rotulo: "Usa anticoagulante (remédio que afina o sangue)?", tipo: "simNao", detalhe: "Qual?" },
    ],
  },
  {
    id: "alergias",
    titulo: "Alergias",
    perguntas: [
      { id: "alergia", rotulo: "Tem alergia a medicamento, alimento, látex ou outra substância?", tipo: "simNao", detalhe: "A quê?" },
      { id: "reacaoAnestesia", rotulo: "Já teve reação a anestesia dentária?", tipo: "simNao", detalhe: "Qual reação?" },
    ],
  },
  {
    id: "habitos",
    titulo: "Hábitos",
    perguntas: [
      { id: "fuma", rotulo: "Fuma?", tipo: "simNao", detalhe: "Quanto por dia?" },
      { id: "bebida", rotulo: "Consome bebida alcoólica?", tipo: "simNao", detalhe: "Com que frequência?" },
      { id: "rangeOuAperta", rotulo: "Range ou aperta os dentes?", tipo: "simNao" },
      { id: "escovacoesPorDia", rotulo: "Quantas vezes escova os dentes por dia?", tipo: "texto" },
    ],
  },
  {
    id: "historicoOdontologico",
    titulo: "Histórico odontológico",
    perguntas: [
      { id: "gengivaSangra", rotulo: "A gengiva sangra?", tipo: "simNao" },
      { id: "sensibilidade", rotulo: "Sente sensibilidade nos dentes?", tipo: "simNao", detalhe: "Onde?" },
      { id: "ortodontia", rotulo: "Já fez ou faz tratamento ortodôntico (aparelho)?", tipo: "simNao" },
      { id: "ultimaConsulta", rotulo: "Quando foi a última consulta ao dentista?", tipo: "texto" },
      { id: "motivoDaConsulta", rotulo: "Qual o motivo da consulta?", tipo: "texto" },
    ],
  },
] as const satisfies readonly Secao[];

/** Todas as perguntas, na ordem das seções. */
export const PERGUNTAS: readonly Pergunta[] = SECOES.flatMap((s): readonly Pergunta[] => s.perguntas);

type PerguntaDoQuestionario = (typeof SECOES)[number]["perguntas"][number];

/** O id de cada pergunta, como tipo literal: `Respostas` e quem lê uma resposta por id só aceitam estes. */
export type PerguntaId = PerguntaDoQuestionario["id"];

/** O que se guarda de uma pergunta sim/não. `detalhe` só vem nas perguntas que têm campo de detalhe. */
export type RespostaSimNao = { sim: boolean; detalhe?: string };

/**
 * As respostas de uma anamnese, por id de pergunta: `{ sim, detalhe? }` nas sim/não e o texto nas de texto.
 * Pergunta sem chave é pergunta não respondida.
 */
export type Respostas = {
  [P in PerguntaDoQuestionario as P["id"]]?: P extends { tipo: "simNao" } ? RespostaSimNao : string;
};

export const LIMITE_DO_DETALHE = 200;
export const LIMITE_DO_TEXTO = 500;

const IDS: ReadonlySet<string> = new Set(PERGUNTAS.map((p) => p.id));

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Se `r` serve à pergunta: o texto (no limite) na de texto; `{ sim, detalhe? }` na sim/não. */
function respostaValida(p: Pergunta, r: unknown): boolean {
  if (p.tipo === "texto") return typeof r === "string" && r.length <= LIMITE_DO_TEXTO;
  if (!ehObjeto(r) || typeof r.sim !== "boolean") return false;
  if (r.detalhe === undefined) return true;
  return p.detalhe !== undefined && typeof r.detalhe === "string" && r.detalhe.length <= LIMITE_DO_DETALHE;
}

/**
 * Se `respostas` pode ser gravada como uma anamnese: só perguntas do questionário, cada resposta do tipo da
 * pergunta e dentro dos limites, e toda pergunta sim/não respondida — "não respondeu" não é "não", e é do
 * "sim" que nasce o alerta. A de texto pode faltar ou ficar em branco. Aceita qualquer valor, para servir a
 * dado guardado ou digitado, e devolve `boolean` (não um predicado de tipo, como `denteValido`: o ramo falso
 * de um predicado estreitaria `Respostas` para `never`).
 */
export function respostasValidas(respostas: unknown): boolean {
  if (!ehObjeto(respostas) || !Object.keys(respostas).every((id) => IDS.has(id))) return false;
  return PERGUNTAS.every((p) => {
    const r = respostas[p.id];
    return r === undefined ? p.tipo === "texto" : respostaValida(p, r);
  });
}
