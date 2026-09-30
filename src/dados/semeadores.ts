import { semeadorDoNucleo, type Semeador } from "./sementes";

// O núcleo primeiro; depois os semeadores dos módulos, achados como as rotas (ADR-003).
const dosModulos = import.meta.glob<{ semeador: Semeador }>("../modulos/*/sementes.ts", { eager: true });

export const SEMEADORES: Semeador[] = [semeadorDoNucleo, ...Object.values(dosModulos).map((m) => m.semeador)];
