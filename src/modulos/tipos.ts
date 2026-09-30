import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";

import type { GlyphName } from "@/ui";

/** Os grupos da coluna lateral, na ordem em que aparecem. */
export const GRUPOS_COLUNA = {
  consultorio: "Consultório",
  gestao: "Gestão",
  cadastros: "Cadastros",
} as const;

export type GrupoColuna = keyof typeof GRUPOS_COLUNA;

/**
 * O que um módulo entrega ao app. Cada `src/modulos/<modulo>/modulo.ts` exporta
 * um `modulo` com este formato, e o registro (`./index.ts`) acha todos sozinho —
 * módulo novo não edita arquivo compartilhado (ADR-003 do cofre).
 */
export type Modulo = {
  /** Identificador estável: `key` da coluna e chave da barra do celular. */
  chave: string;
  rotas: RouteObject[];
  /** Item da coluna lateral. Sem ele, o módulo só tem rotas (ou só a aba). */
  coluna?: {
    grupo: GrupoColuna;
    /** Posição dentro do grupo; empate desempata pela `chave`. */
    ordem: number;
    rotulo: string;
    icone: GlyphName;
    caminho: string;
    /** Ativo só no caminho exato — ligue na raiz. */
    exato?: boolean;
    /** Aparece na barra de baixo do celular. */
    barraCelular?: boolean;
  };
  /** Aba na ficha do paciente (anamnese, odontograma, financeiro…). */
  abaPaciente?: {
    ordem: number;
    rotulo: string;
    Componente: ComponentType<{ pacienteId: string }>;
  };
};
