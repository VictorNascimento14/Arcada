import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica, Expediente } from "@/dominio";

import { UFS } from "./cro";

/** O que o formulário edita: tudo texto, como foi digitado. Campo opcional vazio é `""`. */
export type CamposDaClinica = { nome: string; telefone: string; endereco: string; cidade: string; uf: string };
export type ErrosDaClinica = Partial<Record<keyof CamposDaClinica, string>>;

/** Tamanho máximo de cada campo de texto: o cabeçalho impresso não comporta mais que isso. */
export const LIMITES = { nome: 100, telefone: 20, endereco: 150, cidade: 60 } as const;

const SEMANA_FECHADA: Expediente = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

/** Os campos como o formulário os mostra; sem clínica ainda, tudo vazio. */
export function camposDaClinica(c?: Clinica): CamposDaClinica {
  return { nome: c?.nome ?? "", telefone: c?.telefone ?? "", endereco: c?.endereco ?? "", cidade: c?.cidade ?? "", uf: c?.uf ?? "" };
}

/** Uma mensagem por campo inválido; objeto vazio quando está tudo certo. */
export function validarDadosDaClinica(c: CamposDaClinica): ErrosDaClinica {
  const erros: ErrosDaClinica = {};
  if (!c.nome.trim()) erros.nome = "Informe o nome da clínica.";
  for (const campo of Object.keys(LIMITES) as (keyof typeof LIMITES)[]) {
    if (c[campo].trim().length > LIMITES[campo]) erros[campo] ??= `Use no máximo ${LIMITES[campo]} caracteres.`;
  }
  const uf = c.uf.trim();
  if (uf && !(UFS as readonly string[]).includes(uf)) erros.uf = "Escolha uma UF da lista.";
  return erros;
}

/**
 * Valida e grava os dados da clínica — a validação da tela é conforto, esta é a regra. Devolve os
 * erros por campo; objeto vazio quer dizer que salvou. O `expediente` (e o resto do registro) não
 * é tocado: quem o edita é outra tela.
 */
export function salvarDadosDaClinica(campos: CamposDaClinica): ErrosDaClinica {
  const erros = validarDadosDaClinica(campos);
  if (Object.keys(erros).length > 0) return erros;
  const opcional = (texto: string) => texto.trim() || undefined;
  const atual = clinica.obter(CLINICA_ID) ?? { id: CLINICA_ID, nome: "", expediente: SEMANA_FECHADA };
  clinica.salvar({
    ...atual,
    nome: campos.nome.trim(),
    telefone: opcional(campos.telefone),
    endereco: opcional(campos.endereco),
    cidade: opcional(campos.cidade),
    uf: opcional(campos.uf),
  });
  return {};
}
