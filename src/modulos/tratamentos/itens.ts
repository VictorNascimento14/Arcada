/**
 * O item do plano de tratamento, do formulário ao plano: o procedimento (só os ativos), o dente em notação
 * FDI quando ele exige, as faces que aquele dente tem quando exige face, e o preço — que parte da tabela e
 * pode ser ajustado. O formulário edita texto; `itemDoFormulario` valida e converte para o `ItemPlano`.
 */
import {
  denteValido,
  DENTES_DECIDUOS,
  DENTES_PERMANENTES,
  facesDoDente,
  faceValida,
  formatarReais,
  nomeDente,
  paraCentavos,
  type Arcada,
  type Centavos,
  type Face,
  type ItemPlano,
  type NumeroDente,
  type Procedimento,
} from "@/dominio";

/** O que o formulário edita, como foi digitado. `dente` é o valor do `<select>`: o número em texto, ou vazio. */
export type CamposDoItem = { procedimentoId: string; dente: string; faces: Face[]; preco: string };

/** Uma mensagem por campo inválido. */
export type ErrosDoItem = Partial<Record<keyof CamposDoItem, string>>;

/** O item de um plano antes de ganhar `id`, que quem grava dá. */
export type NovoItem = Omit<ItemPlano, "id" | "realizadoEm">;

export const CAMPOS_VAZIOS: CamposDoItem = { procedimentoId: "", dente: "", faces: [], preco: "" };

export type GrupoDeProcedimentos = { especialidade: string; procedimentos: Procedimento[] };

/** Os procedimentos da escolha: só os ativos, por especialidade e, dentro dela, por nome. Não mexe na lista recebida. */
export function procedimentosParaEscolher(todos: readonly Procedimento[]): GrupoDeProcedimentos[] {
  const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR");
  const grupos = new Map<string, Procedimento[]>();
  for (const p of todos.filter((p) => p.ativo).sort((a, b) => porNome(a.nome, b.nome))) {
    grupos.set(p.especialidade, [...(grupos.get(p.especialidade) ?? []), p]);
  }
  return [...grupos]
    .sort(([a], [b]) => porNome(a, b))
    .map(([especialidade, procedimentos]) => ({ especialidade, procedimentos }));
}

const emOrdem = (dentes: Record<Arcada, readonly NumeroDente[]>) => [...dentes.superior, ...dentes.inferior].sort((a, b) => a - b);

/** Os dentes do `<select>`, pela ordem dos números: os permanentes (11 a 48) e depois os decíduos (51 a 85). */
export const DENTES_PARA_ESCOLHER: { grupo: string; dentes: NumeroDente[] }[] = [
  { grupo: "Permanentes", dentes: emOrdem(DENTES_PERMANENTES) },
  { grupo: "Decíduos", dentes: emOrdem(DENTES_DECIDUOS) },
];

/** `16 — primeiro molar superior direito`. */
export const rotuloDoDente = (dente: NumeroDente) => `${dente} — ${nomeDente(dente)}`;

/** Centavos como se digita no campo, sem o `R$`: `22000` vira `220,00`. O `\s` cobre o espaço não separável do Intl. */
export const precoEmTexto = (centavos: Centavos) => formatarReais(centavos).replace(/^R\$\s*/, "");

/** Escolher o procedimento traz o preço da tabela para o campo, no lugar do que se tinha ajustado. */
export function escolherProcedimento(campos: CamposDoItem, procedimento?: Procedimento): CamposDoItem {
  return { ...campos, procedimentoId: procedimento?.id ?? "", preco: procedimento ? precoEmTexto(procedimento.preco) : "" };
}

/** Trocar o dente tira as faces que o novo não tem: a oclusal do 16 não existe no 11. */
export function escolherDente(campos: CamposDoItem, dente: string): CamposDoItem {
  return { ...campos, dente, faces: campos.faces.filter((f) => faceValida(Number(dente), f)) };
}

export function alternarFace(campos: CamposDoItem, face: Face): CamposDoItem {
  const marcada = campos.faces.includes(face);
  return { ...campos, faces: marcada ? campos.faces.filter((f) => f !== face) : [...campos.faces, face] };
}

/**
 * Valida o formulário contra o catálogo e devolve o item, ou os erros por campo.
 *
 * - O procedimento tem de existir e estar ativo.
 * - `exigeDente` pede um dente que exista na FDI; `exigeFace` (que implica dente) pede ao menos uma face, e todas
 *   têm de existir naquele dente. O item guarda as faces na ordem do dente (V, M, D, P ou L, O ou I).
 * - Procedimento que não pede dente ignora o que estiver nos campos de dente e de face.
 * - O preço é o digitado, em centavos: parte do da tabela, mas quem decide é o campo. Zero vale (cortesia).
 */
export function itemDoFormulario(
  campos: CamposDoItem,
  procedimentos: readonly Procedimento[],
): { item: NovoItem } | { erros: ErrosDoItem } {
  const erros: ErrosDoItem = {};
  const procedimento = procedimentos.find((p) => p.ativo && p.id === campos.procedimentoId);
  if (!procedimento) erros.procedimentoId = "Escolha o procedimento.";

  const pedeFace = procedimento?.exigeFace === true;
  const pedeDente = pedeFace || procedimento?.exigeDente === true;
  const dente = Number(campos.dente); // vazio dá 0, que a FDI não tem
  if (pedeDente && !denteValido(dente)) erros.dente = "Escolha o dente.";
  if (pedeFace && !erros.dente) {
    if (campos.faces.length === 0) erros.faces = "Marque ao menos uma face.";
    else if (campos.faces.some((f) => !faceValida(dente, f))) erros.faces = "Há face que este dente não tem.";
  }

  const preco = paraCentavos(campos.preco);
  if (preco === null) erros.preco = "Informe o preço, como 220,00.";

  // `!procedimento` e `preco === null` já puseram o erro deles; a checagem só ensina isso ao compilador.
  if (!procedimento || preco === null || Object.keys(erros).length > 0) return { erros };
  const item: NovoItem = { procedimentoId: procedimento.id, preco };
  if (pedeDente) item.dente = dente;
  if (pedeFace) item.faces = facesDoDente(dente).filter((f) => campos.faces.includes(f));
  return { item };
}
