import { useId, useState, type FormEvent } from "react";

import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, GlassCard, TextField, toast } from "@/ui";
import { anamneses, salvarAnamnese, versoesDoPaciente } from "./dados";
import HistoricoDeVersoes from "./HistoricoDeVersoes";
import { LIMITE_DO_DETALHE, LIMITE_DO_TEXTO, PERGUNTAS, SECOES, type RespostaSimNao, type Secao } from "./questionario";
import SeloAlertas from "./SeloAlertas";

/** O que está na tela: uma pergunta sem chave ainda não foi respondida. `salvarAnamnese` limpa e valida. */
type Rascunho = Record<string, RespostaSimNao | string>;

const secoes: readonly Secao[] = SECOES;

// Sim/Não são radios de verdade, escondidos (`sr-only`) atrás de uma pílula: teclado e leitor de tela ficam com o
// controle nativo, e o foco aparece na pílula.
const PILULA =
  "press inline-flex cursor-pointer items-center rounded-full bg-secondary-100 px-4 py-1.5 text-sm font-semibold text-secondary-800 outline outline-2 outline-offset-2 outline-transparent transition-colors hover:bg-secondary-200 peer-checked:bg-primary-900 peer-checked:text-primary-50 peer-focus-visible:outline-foreground-950";

type Props = { pacienteId: string };

function Formulario({ pacienteId }: Props) {
  const ultima = versoesDoPaciente(useColecao(anamneses), pacienteId)[0];
  // ponytail: o rascunho vive no componente, e a ficha monta só a aba ativa — trocar de aba antes de salvar
  // descarta o que foi digitado. Se doer, guardar o rascunho por paciente fora do componente.
  const [respostas, setRespostas] = useState<Rascunho>(() => ({ ...ultima?.respostas }));
  const [tentou, setTentou] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const base = useId();

  const respondida = (id: string) => typeof respostas[id] === "object";
  const faltam = PERGUNTAS.filter((p) => p.tipo === "simNao" && !respondida(p.id));

  const marcar = (id: string, sim: boolean) =>
    setRespostas((r) => {
      const atual = r[id];
      return { ...r, [id]: typeof atual === "object" ? { ...atual, sim } : { sim } };
    });
  const detalhar = (id: string, detalhe: string) => setRespostas((r) => ({ ...r, [id]: { sim: true, detalhe } }));
  const escrever = (id: string, texto: string) => setRespostas((r) => ({ ...r, [id]: texto }));

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    if (faltam.length > 0) {
      document.getElementById(`${base}-${faltam[0].id}`)?.focus(); // a primeira, na ordem da tela
      return;
    }
    const versao = salvarAnamnese(pacienteId, respostas);
    setFalhou(!versao);
    if (versao) toast("Anamnese salva", `Versão de ${dataBR(versao.data)}.`);
  }

  return (
    <GlassCard className="p-5 md:p-[26px]">
      <h2 className="text-xl font-bold text-foreground-950">Anamnese</h2>
      <p className="mt-0.5 text-foreground-500">
        {ultima ? `Última versão: ${dataBR(ultima.data)}.` : "Nenhuma anamnese registrada."} Cada vez que você salva, uma nova
        versão é gravada com a data de hoje.
      </p>
      {/* Os alertas são os da última versão salva, não os do que está sendo digitado. `empty:hidden`: sem alerta, sem espaço. */}
      <div className="mt-3 empty:hidden">
        <SeloAlertas pacienteId={pacienteId} />
      </div>

      {/* `noValidate`: as mensagens são as do app, em português e iguais em todo navegador. */}
      <form noValidate onSubmit={enviar} className="mt-6 grid gap-8">
        {secoes.map((secao) => (
          <section key={secao.id} aria-labelledby={`${base}-${secao.id}`}>
            <h3 id={`${base}-${secao.id}`} className="mb-4 text-lg font-bold text-foreground-950">
              {secao.titulo}
            </h3>
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {secao.perguntas.map((p) => {
                const r = respostas[p.id];
                if (p.tipo === "texto") {
                  return (
                    <TextField
                      key={p.id}
                      label={p.rotulo}
                      value={typeof r === "string" ? r : ""}
                      onChange={(e) => escrever(p.id, e.target.value)}
                      maxLength={LIMITE_DO_TEXTO}
                      autoComplete="off"
                    />
                  );
                }
                const resposta = typeof r === "object" ? r : undefined;
                return (
                  <fieldset key={p.id} className="min-w-0">
                    <legend className="mb-1.5 text-sm font-medium text-foreground-700">{p.rotulo}</legend>
                    <div className="flex gap-2 p-1">
                      {[true, false].map((sim) => (
                        <label key={String(sim)}>
                          <input
                            type="radio"
                            name={`${base}-${p.id}`}
                            id={sim ? `${base}-${p.id}` : undefined}
                            checked={resposta?.sim === sim}
                            onChange={() => marcar(p.id, sim)}
                            className="peer sr-only"
                          />
                          <span className={PILULA}>{sim ? "Sim" : "Não"}</span>
                        </label>
                      ))}
                    </div>
                    {resposta?.sim && p.detalhe && (
                      <TextField
                        className="mt-2"
                        label={p.detalhe}
                        value={resposta.detalhe ?? ""}
                        onChange={(e) => detalhar(p.id, e.target.value)}
                        maxLength={LIMITE_DO_DETALHE}
                        autoComplete="off"
                      />
                    )}
                    {tentou && !resposta && <p className="mt-1.5 text-xs text-red-600">Responda sim ou não.</p>}
                  </fieldset>
                );
              })}
            </div>
          </section>
        ))}

        {/* Quem usa leitor de tela ouve o resumo; quem enxerga já tem cada erro na sua pergunta. */}
        {tentou && faltam.length > 0 && (
          <p role="alert" className="sr-only">
            Responda sim ou não a todas as perguntas: faltam {faltam.length}.
          </p>
        )}
        {falhou && (
          <p role="alert" className="text-sm text-red-600">
            Não foi possível salvar a anamnese. Confira as respostas e tente de novo.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit">Salvar anamnese</Button>
        </div>
      </form>
    </GlassCard>
  );
}

/**
 * A aba "Anamnese" da ficha: o formulário e, abaixo, o histórico de versões. A `key` dá a cada paciente a sua
 * tela: a ficha reaproveita a aba ao trocar de paciente, e sem ela o que foi digitado para um ficaria na tela
 * do outro. Fica no elemento de fora: duas `key` iguais em irmãos (uma em cada cartão) se confundem.
 */
export default function FormularioAnamnese({ pacienteId }: Props) {
  return (
    <div key={pacienteId} className="grid gap-4">
      <Formulario pacienteId={pacienteId} />
      <HistoricoDeVersoes pacienteId={pacienteId} />
    </div>
  );
}
