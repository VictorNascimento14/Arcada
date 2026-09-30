// O receituário: paciente, profissional, data e um texto livre. Regra pura, sem React: a tela só chama `prepararReceituario`.
// O app não sugere medicamento, dose nem conduta: o texto começa vazio e é todo de quem escreve.

import type { DataISO, Paciente, Profissional } from "@/dominio";

import { dataValida, resolverEscolha, type ErrosDaEscolha } from "./validacao";

/** Cabe numa página A4 com o cabeçalho da clínica e a assinatura. */
export const LIMITE_DO_TEXTO = 2000;

/** O formulário, como foi digitado. */
export type CamposDoReceituario = { pacienteId: string; profissionalId: string; data: DataISO; texto: string };
export type ErrosDoReceituario = ErrosDaEscolha & { data?: string; texto?: string };

/** O formulário de um receituário novo, na data de `hoje` (`diaISO(new Date())` de `@/ui`), com o texto vazio. */
export const camposDoReceituario = (hoje: DataISO): CamposDoReceituario => ({ pacienteId: "", profissionalId: "", data: hoje, texto: "" });

/** O que a folha imprime: só o nome do paciente e o nome e o CRO de quem assina, sem o resto do cadastro. */
export type DadosDoReceituario = {
  paciente: Pick<Paciente, "nome">;
  profissional: Pick<Profissional, "nome" | "cro">;
  data: DataISO;
  texto: string;
};

export type ResultadoDoReceituario = { ok: true; dados: DadosDoReceituario } | { ok: false; erros: ErrosDoReceituario };

/**
 * Confere o formulário e, estando tudo certo, monta o que vai para o papel. As quebras de linha e o recuo do texto
 * ficam como foram digitados; só sobram cortados os espaços e as linhas em branco das pontas.
 */
export function prepararReceituario(
  campos: CamposDoReceituario,
  pacientes: readonly Paciente[],
  profissionais: readonly Profissional[],
): ResultadoDoReceituario {
  const { paciente, profissional, erros: escolha } = resolverEscolha(campos.pacienteId, campos.profissionalId, pacientes, profissionais);
  const erros: ErrosDoReceituario = { ...escolha };
  const texto = campos.texto.trim();

  if (!dataValida(campos.data)) erros.data = "Informe a data.";
  if (!texto) erros.texto = "Escreva o texto do receituário.";
  else if (texto.length > LIMITE_DO_TEXTO) erros.texto = `Use no máximo ${LIMITE_DO_TEXTO} caracteres.`;

  if (!paciente || !profissional || Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: { paciente: { nome: paciente.nome }, profissional: { nome: profissional.nome, cro: profissional.cro }, data: campos.data, texto },
  };
}
