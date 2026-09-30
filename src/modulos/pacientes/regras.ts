// As regras de escrita do paciente: o que o cadastro aceita e como o dado é guardado. O formulário mostra
// as mensagens de `validarPaciente`, mas isso é conforto: quem barra dado ruim é `cadastrarPaciente`, que
// valida de novo antes de gravar — outra tela ou uma importação passaria direto pelo formulário.

import { pacientes } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import type { Paciente } from "@/dominio";

import { linkTelefone } from "./contato";
import { cpfValido, limparCpf } from "./cpf";

/** O que o formulário entrega: os campos como foram digitados, sem tratamento. */
export type DadosPaciente = {
  nome: string;
  nascimento: string;
  cpf: string;
  telefone: string;
  email: string;
  convenio: string;
  observacoes: string;
};

/** Uma mensagem por campo inválido, na ordem dos campos do formulário. */
export type ErrosPaciente = Partial<Record<keyof DadosPaciente, string>>;

export const DADOS_EM_BRANCO: DadosPaciente = {
  nome: "",
  nascimento: "",
  cpf: "",
  telefone: "",
  email: "",
  convenio: "",
  observacoes: "",
};

/** Tamanho máximo, em caracteres, de cada campo de texto. */
export const LIMITES = { nome: 120, email: 254, convenio: 80, observacoes: 1000 } as const;

/** Antes disso é erro de digitação (`0202` em vez de `2002`), não um paciente. */
export const NASCIMENTO_MINIMO = "1900-01-01";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `AAAA-MM-DD` que existe no calendário: 30/02 não passa, 29/02 só em ano bissexto. */
function dataReal(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [ano, mes, dia] = m.slice(1).map(Number);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= new Date(ano, mes, 0).getDate();
}

/**
 * Confere `dados` e devolve os erros por campo (objeto vazio: pode gravar). `hoje` é `diaISO(new Date())` de
 * `@/ui`. Só nome e nascimento são obrigatórios; o que vier nos outros campos tem de estar certo.
 * As mensagens não repetem o valor digitado: é dado pessoal.
 */
export function validarPaciente(dados: DadosPaciente, hoje: string): ErrosPaciente {
  const erros: ErrosPaciente = {};

  const nome = dados.nome.trim();
  if (!nome) erros.nome = "Informe o nome do paciente.";
  else if (nome.length > LIMITES.nome) erros.nome = `O nome pode ter no máximo ${LIMITES.nome} caracteres.`;

  const nascimento = dados.nascimento;
  if (!nascimento) erros.nascimento = "Informe a data de nascimento.";
  else if (!dataReal(nascimento) || nascimento < NASCIMENTO_MINIMO) erros.nascimento = "Data de nascimento inválida.";
  else if (nascimento > hoje) erros.nascimento = "A data de nascimento não pode ser no futuro.";

  if (dados.cpf.trim() && !cpfValido(dados.cpf)) erros.cpf = "CPF inválido. Confira os 11 dígitos.";

  // O mesmo critério dos botões de WhatsApp e ligação da ficha: telefone que eles aceitam.
  if (dados.telefone.trim() && !linkTelefone(dados.telefone)) erros.telefone = "Telefone inválido. Informe o DDD e o número.";

  const email = dados.email.trim();
  if (email && (email.length > LIMITES.email || !EMAIL.test(email))) erros.email = "E-mail inválido.";

  if (dados.convenio.trim().length > LIMITES.convenio) erros.convenio = `O convênio pode ter no máximo ${LIMITES.convenio} caracteres.`;
  if (dados.observacoes.trim().length > LIMITES.observacoes) {
    erros.observacoes = `As observações podem ter no máximo ${LIMITES.observacoes} caracteres.`;
  }

  return erros;
}

/**
 * O paciente como é guardado: texto aparado, espaços repetidos do nome colapsados, CPF só com os dígitos
 * (`cpf.ts`), convênio `Particular` quando vem em branco e campo opcional vazio ausente (não `""`).
 * Não valida: quem chama passa por `validarPaciente`.
 */
export function montarPaciente(dados: DadosPaciente, id: string): Paciente {
  const cpf = limparCpf(dados.cpf);
  const email = dados.email.trim();
  const observacoes = dados.observacoes.trim();
  return {
    id,
    nome: dados.nome.trim().replace(/\s+/g, " "),
    nascimento: dados.nascimento,
    telefone: dados.telefone.trim(),
    ...(cpf ? { cpf } : {}),
    ...(email ? { email } : {}),
    convenio: dados.convenio.trim() || "Particular",
    ...(observacoes ? { observacoes } : {}),
  };
}

/**
 * Cadastra o paciente e o devolve, já com o `id`. Lança, sem gravar nada, se `dados` não passa em
 * `validarPaciente` — a mensagem nomeia os campos, nunca os valores.
 */
export function cadastrarPaciente(dados: DadosPaciente, hoje: string): Paciente {
  const erros = validarPaciente(dados, hoje);
  if (Object.keys(erros).length > 0) throw new Error(`Paciente inválido: ${Object.keys(erros).join(", ")}.`);
  const paciente = montarPaciente(dados, novoId());
  pacientes.salvar(paciente);
  return paciente;
}
