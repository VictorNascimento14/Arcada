/**
 * Registrar procedimento realizado: marca `realizadoEm` nos itens escolhidos de um plano do paciente. A regra mora
 * aqui, e não no botão: só o plano aprovado ou em andamento recebe registro (o proposto ainda não foi aceito; o
 * recusado e o concluído acabaram), e o primeiro item feito abre o andamento (`transitar`, de `tratamentos/situacao`).
 * Cada item realizado deixa no odontograma do paciente a condição do procedimento (`odontograma.ts`).
 * É tudo ou nada: se um item escolhido não vale, ou se uma marca dele não cabe no odontograma, nada é gravado, e um
 * item já realizado nunca muda de data.
 *
 * ponytail: o item guarda só o dia (`ItemPlano.realizadoEm`), não quem fez. O profissional é o da consulta, que a
 * tela mostra, e o da evolução clínica. Guardá-lo por item pede um campo novo em `ItemPlano` (`src/dominio`).
 * ponytail: o último item feito não conclui o plano; quem conclui é o botão `Concluir` da tela do plano. Automatizar
 * é chamar `transitar(plano, "concluido")` aqui quando todos os itens tiverem `realizadoEm`.
 */
import { planos, procedimentos } from "@/dados/colecoes";
import type { DataISO, PlanoTratamento } from "@/dominio";
import type { Marca } from "@/modulos/odontograma/marcas";
import { transitar } from "@/modulos/tratamentos/situacao";

import { aplicarMarcas, marcasDoItem, motivoDeNaoCaber } from "./odontograma";

/** `marcas` são as que os itens realizados deixam no odontograma (vazio quando nenhum procedimento muda o dente). */
export type ResultadoDoRegistro = { ok: true; plano: PlanoTratamento; marcas: Marca[] } | { ok: false; erro: string };

/** O plano onde se registra procedimento: aprovado ou em andamento. */
export const aceitaRegistro = (plano: PlanoTratamento): boolean => plano.situacao === "aprovado" || plano.situacao === "em-andamento";

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Marca os itens `itemIds` do plano como realizados em `dia` (`diaISO`). Devolve o plano gravado, ou o motivo de não ter gravado. */
export function registrarRealizados(planoId: string, itemIds: readonly string[], dia: DataISO): ResultadoDoRegistro {
  const plano = planos.obter(planoId);
  if (!plano) return { ok: false, erro: "Este plano não existe mais." };
  if (!aceitaRegistro(plano)) return { ok: false, erro: "Só se registra procedimento em plano aprovado ou em andamento." };
  if (!FORMATO_DIA.test(dia)) return { ok: false, erro: "A data do registro é inválida." };

  const escolhidos = new Set(itemIds);
  if (escolhidos.size === 0) return { ok: false, erro: "Escolha ao menos um item." };
  const alvos = plano.itens.filter((i) => escolhidos.has(i.id));
  if (alvos.length !== escolhidos.size) return { ok: false, erro: "Um dos itens escolhidos não está mais no plano." };
  if (alvos.some((i) => i.realizadoEm)) return { ok: false, erro: "Um dos itens escolhidos já foi realizado." };

  const marcas = alvos.flatMap((i) => marcasDoItem(i, procedimentos.obter(i.procedimentoId)));
  const motivo = motivoDeNaoCaber(marcas);
  if (motivo) return { ok: false, erro: `O procedimento não cabe no odontograma: ${motivo}` };

  const marcado = { ...plano, itens: plano.itens.map((i) => (escolhidos.has(i.id) ? { ...i, realizadoEm: dia } : i)) };
  const gravado = plano.situacao === "aprovado" ? transitar(marcado, "em-andamento") : marcado;
  planos.salvar(gravado);
  aplicarMarcas(plano.pacienteId, marcas);
  return { ok: true, plano: gravado, marcas };
}
