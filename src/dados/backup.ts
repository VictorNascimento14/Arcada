// Backup e restauração dos dados locais (ADR-001). Como `colecao.ts`, mora em `src/dados/`: é onde se enumeram e se escrevem as
// chaves do `localStorage`. Tudo o que o repositório guarda está sob o prefixo `arcada:` — uma chave por coleção e as
// marcas de semente (`arcada:sementes:*`). As preferências do kit (`arcada-tema`, `arcada-sidebar-collapsed`) usam
// traço: ficam fora do prefixo, do backup e da limpeza — assim como as chaves de outro app na mesma origem.
//
// As coleções guardam o estado em memória. Quem troca as chaves aqui TEM de recarregar a página em seguida
// (`location.reload()`): senão a tela segue mostrando o que já estava carregado, e o próximo `salvar` de uma coleção
// grava o estado antigo por cima do que acabou de entrar.

import { PREFIXO } from "./colecao";

/** O campo `app` do arquivo: um JSON de outro programa não passa por backup do Arcada. */
export const APP_DO_BACKUP = "arcada";

/** A versão do FORMATO DO ARQUIVO (a de cada coleção vai dentro de `dados`). Sobe quando o envelope muda. */
export const VERSAO_DO_BACKUP = 1;

/** A marca "este semeador já rodou nesta versão" (`sementes.ts`): guarda só a versão, sem o envelope de coleção. */
const MARCA_DE_SEMENTE = `${PREFIXO}sementes:`;

export interface Backup {
  app: typeof APP_DO_BACKUP;
  versao: number;
  /** O instante da exportação, em ISO 8601 UTC. O DIA local sai de `diaISO(new Date(exportadoEm))`. */
  exportadoEm: string;
  /** Chave do `localStorage` → o valor exatamente como estava guardado (texto): coleções e marcas de semente. */
  dados: Record<string, string>;
}

/** `{ erro }` é uma frase para a tela. */
export type LeituraDoBackup = { backup: Backup } | { erro: string };

const FORA_DO_FORMATO = "O arquivo está fora do formato de backup do Arcada.";

/** `localStorage` quando dá para usá-lo: só o ACESSO à propriedade já pode lançar (site bloqueado). */
function armazenamento(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** As chaves do Arcada, em ordem. Colhe todas antes de qualquer remoção: `removeItem` desloca os índices de `key(i)`. */
function chavesDoArcada(s: Storage): string[] {
  const chaves: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const chave = s.key(i);
    if (chave?.startsWith(PREFIXO)) chaves.push(chave);
  }
  return chaves.sort();
}

/** Apaga as chaves do Arcada e grava `dados` no lugar. O resto do `localStorage` não é tocado. */
function trocarChaves(s: Storage, dados: Record<string, string>): void {
  for (const chave of chavesDoArcada(s)) s.removeItem(chave);
  for (const [chave, valor] of Object.entries(dados)) s.setItem(chave, valor);
}

/** Tudo o que o Arcada guarda neste navegador, pronto para virar arquivo. Não altera nada. */
export function exportarBackup(agora: Date = new Date()): Backup {
  const s = armazenamento();
  const dados: Record<string, string> = {};
  if (s) for (const chave of chavesDoArcada(s)) dados[chave] = s.getItem(chave) ?? "";
  return { app: APP_DO_BACKUP, versao: VERSAO_DO_BACKUP, exportadoEm: agora.toISOString(), dados };
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Uma coleção guarda `{ versao, itens }` com `id` em cada item (`colecao.ts`); a marca de semente, só o texto. */
function valorValido(chave: string, valor: unknown): boolean {
  if (typeof valor !== "string") return false;
  if (chave.startsWith(MARCA_DE_SEMENTE)) return true;
  try {
    const envelope: unknown = JSON.parse(valor);
    return (
      ehObjeto(envelope) &&
      typeof envelope.versao === "number" &&
      Array.isArray(envelope.itens) &&
      envelope.itens.every((i) => ehObjeto(i) && typeof i.id === "string" && i.id !== "")
    );
  } catch {
    return false;
  }
}

/**
 * Confere o texto de um arquivo — JSON, `app`, versão e formato do que vai dentro — SEM tocar no armazenamento: é a
 * validação que vem antes de `substituirPor`. Só chave sob `arcada:` passa, para um arquivo alterado não escrever
 * preferência do kit nem chave de outro app.
 */
export function lerBackup(texto: string): LeituraDoBackup {
  let arquivo: unknown;
  try {
    arquivo = JSON.parse(texto);
  } catch {
    return { erro: "O arquivo não é um JSON válido." };
  }
  if (!ehObjeto(arquivo) || arquivo.app !== APP_DO_BACKUP) return { erro: "Este arquivo não é um backup do Arcada." };

  const { versao, exportadoEm, dados } = arquivo;
  if (typeof versao !== "number" || !Number.isInteger(versao) || versao < 1) return { erro: FORA_DO_FORMATO };
  if (versao > VERSAO_DO_BACKUP) {
    return { erro: "Este backup foi gerado por uma versão mais nova do Arcada. Atualize o app para importá-lo." };
  }
  if (typeof exportadoEm !== "string" || Number.isNaN(Date.parse(exportadoEm)) || !ehObjeto(dados)) {
    return { erro: FORA_DO_FORMATO };
  }
  if (!Object.entries(dados).every(([chave, valor]) => chave.startsWith(PREFIXO) && valorValido(chave, valor))) {
    return { erro: FORA_DO_FORMATO };
  }
  // Todo valor é texto: `valorValido` acabou de conferir.
  return { backup: { app: APP_DO_BACKUP, versao, exportadoEm, dados: dados as Record<string, string> } };
}

/**
 * Troca tudo o que o Arcada guarda pelo conteúdo do backup (de `lerBackup`). Devolve a frase de erro, ou `undefined`
 * quando deu certo — e aí a página tem de ser recarregada. Se a gravação falha no meio (armazenamento cheio), o que
 * havia antes volta e o erro é devolvido: ninguém fica com metade do backup.
 *
 * ponytail: se até devolver o que havia falhar (o armazenamento morreu de vez), o erro sobe igual e o estado em
 * disco pode ficar incompleto; a memória das coleções segue intacta até o próximo `salvar` de cada uma.
 */
export function substituirPor({ dados }: Backup): string | undefined {
  const s = armazenamento();
  if (!s) return "O navegador bloqueou o armazenamento local: não dá para importar o backup.";
  const antes = exportarBackup().dados;
  try {
    trocarChaves(s, dados);
  } catch {
    try {
      trocarChaves(s, antes);
    } catch {
      /* ver o ponytail acima */
    }
    return "Não foi possível gravar o backup: o armazenamento do navegador está cheio ou bloqueado. Os dados atuais foram mantidos.";
  }
}

/**
 * Apaga tudo o que o Arcada guarda — coleções e marcas de semente — e devolve o app ao estado de primeira visita. A
 * marca vai junto de propósito: `carregarSementes` pula o semeador cuja marca está na versão, então com ela no lugar
 * a página recarregaria VAZIA. Recarregar é com quem chama (ver o topo do arquivo): no carregamento seguinte as
 * sementes plantam a demonstração de novo. Preferências do kit (`arcada-tema`…) e chaves de outro app ficam.
 */
export function restaurarDemonstracao(): void {
  const s = armazenamento();
  if (s) trocarChaves(s, {});
}
