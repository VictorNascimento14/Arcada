import { montarNavegacao } from "./navegacao";
import type { Modulo } from "./tipos";

// Todo `src/modulos/<modulo>/modulo.ts` entra sozinho. `eager`: as rotas precisam
// existir quando o roteador é criado.
const arquivos = import.meta.glob<{ modulo: Modulo }>("./*/modulo.ts", { eager: true });

export const NAVEGACAO = montarNavegacao(Object.values(arquivos).map((a) => a.modulo));
export type { Modulo } from "./tipos";
export type { AbaPaciente } from "./navegacao";
