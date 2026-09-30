// As marcas do odontograma: que condição está em que face ou dente. Regra pura, sem React nem armazenamento
// (quem guarda é `dados.ts`).
//
// Uma FACE tem no máximo uma condição: cárie, restauração e selante são o estado da superfície, então marcar
// outra a substitui. O DENTE INTEIRO pode ter várias ao mesmo tempo (tratamento de canal e coroa, por exemplo),
// cada uma ligada e desligada por si.

import { denteValido, faceValida } from "@/dominio/fdi";
import type { Face, NumeroDente } from "@/dominio/odontologia";

import { CONDICOES, type CondicaoDeDente, type CondicaoDeFace } from "./condicoes";

export type MarcaDeFace = { dente: NumeroDente; face: Face; condicao: CondicaoDeFace };
export type MarcaDeDente = { dente: NumeroDente; condicao: CondicaoDeDente };
export type Marca = MarcaDeFace | MarcaDeDente;

const faceDe = (marca: Marca): Face | undefined => ("face" in marca ? marca.face : undefined);

/**
 * Lança `RangeError` se a marca não faz sentido: dente que não existe, condição fora da lista, face que o dente
 * não tem ou que falta onde a condição é de face, e face onde a condição vale no dente inteiro. É a regra da
 * escrita; a tela só oferece o que passa por aqui.
 */
export function conferirMarca(marca: Marca): void {
  const condicao = CONDICOES.find((c) => c.id === marca.condicao); // pode vir de dado guardado ou digitado
  if (!condicao) throw new RangeError(`Condição "${marca.condicao}" não existe.`);
  if (!denteValido(marca.dente)) throw new RangeError(`Dente ${marca.dente} não existe na notação FDI.`);

  const face = faceDe(marca);
  if (condicao.escopo === "dente" && face !== undefined) {
    throw new RangeError(`${condicao.rotulo} vale no dente inteiro, não numa face.`);
  }
  if (condicao.escopo === "face" && (face === undefined || !faceValida(marca.dente, face))) {
    throw new RangeError(`${condicao.rotulo} pede uma face que o dente ${marca.dente} tenha.`);
  }
}

/**
 * Liga ou desliga a marca. Devolve a lista nova (a recebida não muda) e se a condição ficou aplicada: numa face,
 * a mesma condição de novo a remove e outra a substitui; no dente inteiro, a mesma condição de novo a remove e
 * uma diferente se soma às que já estão. Parte de marca já conferida.
 */
export function alternarMarca(marcas: readonly Marca[], nova: Marca): { marcas: Marca[]; aplicada: boolean } {
  const face = faceDe(nova);
  // O "lugar" da marca: a face, numa marca de face; a própria condição, numa de dente inteiro (várias convivem).
  const noMesmoLugar = (m: Marca) =>
    m.dente === nova.dente && faceDe(m) === face && (face !== undefined || m.condicao === nova.condicao);

  const ocupante = marcas.find(noMesmoLugar);
  const resto = marcas.filter((m) => !noMesmoLugar(m));
  return ocupante?.condicao === nova.condicao ? { marcas: resto, aplicada: false } : { marcas: [...resto, nova], aplicada: true };
}
