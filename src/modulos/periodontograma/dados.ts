// A coleção `exames-perio`, dado só deste módulo: um exame periodontal por paciente por dia. O exame de hoje
// nasce na primeira medida registrada e é editado no lugar durante o dia; os dos dias anteriores ficam como
// estavam, para serem comparados. A escrita valida; a validação da tela é só conforto.

import { criarColecao } from "@/dados/colecao";
import { pacientes } from "@/dados/colecoes";
import { novoId } from "@/dados/id";
import { useColecao } from "@/dados/useColecao";
import { denteValido, type DataISO, type NumeroDente } from "@/dominio";
import { diaISO } from "@/ui";

import type { ExamePerio, MedidaSitio, Sitio } from "./exame";
import { medidaValida, type CampoMedida, type Sinal } from "./grade";

export type ExameSalvo = {
  id: string;
  pacienteId: string;
  /** O dia do exame (`diaISO`). */
  data: DataISO;
  dentes: ExamePerio;
};

export const examesPerio = criarColecao<ExameSalvo>("exames-perio");

const doDia = (pacienteId: string, dia: DataISO) => (e: ExameSalvo) => e.pacienteId === pacienteId && e.data === dia;

/** O exame do paciente naquele dia, reativo; `undefined` enquanto nada foi registrado nele. */
export function useExameDoDia(pacienteId: string, dia: DataISO): ExameSalvo | undefined {
  return useColecao(examesPerio).find(doDia(pacienteId, dia));
}

/**
 * Aplica `mudar` à medida do sítio no exame de hoje do paciente e grava, criando o exame na primeira medida.
 * `mudar` devolve a medida nova, ou `null` quando não há o que mudar: aí nada é gravado, e o exame não nasce
 * por isso. Devolve `false`, sem gravar, se o paciente ou o dente não existem.
 */
function atualizarSitio(
  pacienteId: string,
  dente: NumeroDente,
  sitio: Sitio,
  mudar: (medida: MedidaSitio) => MedidaSitio | null,
): boolean {
  if (!pacientes.obter(pacienteId) || !denteValido(dente)) return false;
  const hoje = diaISO(new Date());
  const exame = examesPerio.listar().find(doDia(pacienteId, hoje)) ?? { id: novoId(), pacienteId, data: hoje, dentes: {} };
  const registro = exame.dentes[dente] ?? {};
  const medida = mudar(registro.sitios?.[sitio] ?? {});
  if (medida) {
    examesPerio.salvar({
      ...exame,
      dentes: { ...exame.dentes, [dente]: { ...registro, sitios: { ...registro.sitios, [sitio]: medida } } },
    });
  }
  return true;
}

/**
 * Grava a profundidade ou a margem do sítio no exame de hoje; `undefined` apaga o campo. Devolve `false`,
 * sem gravar, se o valor não serve (ver `medidaValida`) ou se o paciente ou o dente não existem.
 */
export function registrarMedida(
  pacienteId: string,
  dente: NumeroDente,
  sitio: Sitio,
  campo: CampoMedida,
  valor: number | undefined,
): boolean {
  if (valor !== undefined && !medidaValida(campo, valor)) return false;
  return atualizarSitio(pacienteId, dente, sitio, (medida) => {
    if (medida[campo] === valor) return null;
    const nova: MedidaSitio = { ...medida };
    if (valor === undefined) delete nova[campo];
    else nova[campo] = valor;
    return nova;
  });
}

/**
 * Liga ou desliga o sinal (sangramento ou supuração) do sítio no exame de hoje. Ligado guarda `true`;
 * desligado tira o campo, porque "desmarcado" e "sem sinal" são a mesma coisa. Devolve `false`, sem gravar,
 * se o paciente ou o dente não existem.
 */
export function alternarSinal(pacienteId: string, dente: NumeroDente, sitio: Sitio, sinal: Sinal): boolean {
  return atualizarSitio(pacienteId, dente, sitio, (medida) => {
    const nova: MedidaSitio = { ...medida };
    if (medida[sinal]) delete nova[sinal];
    else nova[sinal] = true;
    return nova;
  });
}
