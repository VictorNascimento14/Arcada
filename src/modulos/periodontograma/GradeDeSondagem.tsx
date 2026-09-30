import { useId } from "react";

import { DENTES_PERMANENTES, nomeDente, type Arcada, type NumeroDente } from "@/dominio";

import { SITIOS, type ExamePerio, type Sitio } from "./exame";
import { CAMPOS_DE_MEDIDA, nomeDoSitio, rotuloDoSitio, type CampoMedida } from "./grade";

type Props = {
  arcada: Arcada;
  dentes: ExamePerio;
  /** Um valor digitado num campo; `undefined` quando o campo foi esvaziado. */
  aoMedir: (dente: NumeroDente, sitio: Sitio, campo: CampoMedida, valor: number | undefined) => void;
};

// Na ordem das colunas: primeiro a profundidade dos seis sítios, depois a margem deles.
const MEDIDAS: readonly CampoMedida[] = ["profundidade", "margem"];

// Um risco separa cada grupo de seis colunas e outro, mais fraco, o lado vestibular do lado de dentro.
const divisoria = (i: number) => (i === 0 ? "border-l border-foreground-950/[0.16]" : i === 3 ? "border-l border-foreground-950/[0.06]" : "");

const CABECALHO = "px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-600";
const CAMPO =
  "h-9 w-9 rounded-lg border border-foreground-950/[0.10] bg-surface/70 text-center text-sm tabular-nums text-foreground-950 transition-colors hover:border-foreground-950/25 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/**
 * A grade de sondagem de uma arcada: uma linha por dente permanente, na ordem em que se desenham (da direita
 * para a esquerda do paciente), e uma coluna por sítio, com a profundidade e depois a margem. A tabela rola
 * na horizontal no celular, com a coluna do dente fixa e o título da arcada parado. Só desenha e avisa: quem
 * grava é `aoMedir`.
 */
export default function GradeDeSondagem({ arcada, dentes, aoMedir }: Props) {
  const titulo = useId();
  return (
    <section aria-labelledby={titulo} className="flex flex-col gap-3">
      <h3 id={titulo} className="text-base font-semibold text-foreground-950">
        Arcada {arcada}
      </h3>
      <div className="overflow-x-auto">
        <table aria-labelledby={titulo} className="w-max border-separate border-spacing-0 text-center">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className={`sticky left-0 z-10 bg-surface px-3 text-left ${CABECALHO}`}>
                Dente
              </th>
              {MEDIDAS.map((campo) => (
                <th key={campo} scope="colgroup" colSpan={SITIOS.length} className={`${CABECALHO} border-l border-foreground-950/[0.16]`}>
                  {CAMPOS_DE_MEDIDA[campo].rotulo}
                </th>
              ))}
            </tr>
            <tr>
              {MEDIDAS.flatMap((campo) =>
                SITIOS.map((sitio, i) => (
                  <th key={`${campo}-${sitio}`} scope="col" title={nomeDoSitio(sitio, arcada)} className={`${CABECALHO} ${divisoria(i)}`}>
                    {rotuloDoSitio(sitio, arcada)}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {DENTES_PERMANENTES[arcada].map((dente) => (
              <tr key={dente}>
                <th
                  scope="row"
                  title={nomeDente(dente)}
                  className="sticky left-0 z-10 bg-surface px-3 py-0.5 text-left text-sm font-semibold tabular-nums text-foreground-950"
                >
                  {dente}
                </th>
                {MEDIDAS.flatMap((campo) =>
                  SITIOS.map((sitio, i) => {
                    const { rotulo, min, max } = CAMPOS_DE_MEDIDA[campo];
                    return (
                      <td key={`${campo}-${sitio}`} className={`px-0.5 py-0.5 ${divisoria(i)}`}>
                        <input
                          type="number"
                          // Sem `inputMode` na margem: o teclado numérico do celular não tem o sinal de menos.
                          inputMode={campo === "profundidade" ? "numeric" : undefined}
                          min={min}
                          max={max}
                          step={1}
                          value={dentes[dente]?.sitios?.[sitio]?.[campo] ?? ""}
                          onChange={(e) => aoMedir(dente, sitio, campo, e.target.value === "" ? undefined : e.target.valueAsNumber)}
                          // A roda do mouse sobre um campo em foco muda o valor: sem soltar o foco, rolar a página com o ponteiro na grade estragaria medidas.
                          onWheel={(e) => e.currentTarget.blur()}
                          aria-label={`${rotulo}, dente ${dente}, ${nomeDoSitio(sitio, arcada)}`}
                          className={CAMPO}
                        />
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
