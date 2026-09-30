/**
 * O procedimento realizado no odontograma: o que o item do plano deixa marcado no dente e como aplicar isso sem
 * desfazer o que já está lá. O desenho e a gravação das marcas são do módulo do odontograma; aqui só se decide o que
 * marcar e se importa o que ele exporta.
 */
import type { ItemPlano, Procedimento } from "@/dominio";
import { CONDICOES, ehCondicaoDeFace } from "@/modulos/odontograma/condicoes";
import { alternarMarcaDoPaciente, odontogramas } from "@/modulos/odontograma/dados";
import { alternarMarca, conferirMarca, type Marca } from "@/modulos/odontograma/marcas";

/**
 * As marcas que o item realizado deixa no odontograma: a `condicaoResultante` do procedimento no dente do item, ou,
 * quando a condição é de face, em cada face dele. Vazio quando o procedimento não tem condição (ou ela não está na
 * lista do odontograma), o item não diz o dente, ou a condição é de face e o item não traz face.
 */
export function marcasDoItem(item: ItemPlano, procedimento: Pick<Procedimento, "condicaoResultante"> | undefined): Marca[] {
  const condicao = CONDICOES.find((c) => c.id === procedimento?.condicaoResultante);
  const dente = item.dente;
  if (!condicao || dente === undefined) return [];
  const id = condicao.id;
  return ehCondicaoDeFace(id) ? (item.faces ?? []).map((face) => ({ dente, face, condicao: id })) : [{ dente, condicao: id }];
}

/** O motivo de alguma marca não caber no odontograma (a regra de `conferirMarca`), ou `undefined` se todas cabem. */
export function motivoDeNaoCaber(marcas: readonly Marca[]): string | undefined {
  try {
    marcas.forEach(conferirMarca);
  } catch (erro) {
    if (erro instanceof RangeError) return erro.message;
    throw erro;
  }
  return undefined;
}

/**
 * Aplica as marcas no odontograma do paciente SEM desfazer. `alternarMarcaDoPaciente` liga e desliga: uma marca que já
 * está lá sairia. `alternarMarca` (a regra do próprio odontograma) diz se a alternância ligaria; só então chama o
 * gravador. Numa face, a marca nova substitui a que estava (a cárie vira restauração); no dente inteiro, soma-se às
 * outras. Parte de marcas que cabem (`motivoDeNaoCaber`): uma que não cabe lança `RangeError` antes de gravar.
 */
export function aplicarMarcas(pacienteId: string, marcas: readonly Marca[]): void {
  for (const marca of marcas) {
    const atuais = odontogramas.obter(pacienteId)?.marcas ?? [];
    if (alternarMarca(atuais, marca).aplicada) alternarMarcaDoPaciente(pacienteId, marca);
  }
}
