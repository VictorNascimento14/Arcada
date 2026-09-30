import { SECOES, type Pergunta, type Respostas, type Secao } from "./questionario";

const secoes: readonly Secao[] = SECOES;

/**
 * Como a resposta se lê: `Sim`, `Sim — detalhe` ou `Não`; o texto como foi escrito. `null` quando não há o
 * que ler (pergunta sem resposta, texto em branco). Aceita qualquer valor: é dado guardado, e um registro
 * estragado não pode derrubar a tela.
 */
function leitura(p: Pergunta, r: unknown): string | null {
  if (p.tipo === "texto") return typeof r === "string" && r.trim() ? r.trim() : null;
  if (typeof r !== "object" || r === null || !("sim" in r)) return null;
  if (!r.sim) return "Não";
  const detalhe = "detalhe" in r && typeof r.detalhe === "string" ? r.detalhe.trim() : "";
  return detalhe ? `Sim — ${detalhe}` : "Sim";
}

/**
 * As respostas de uma anamnese, só para ler: cada seção com as suas perguntas, na ordem do questionário.
 * Pergunta sem resposta não some — aparece como não respondida, para ninguém tomar a falta por um "não".
 * Serve à tela e à folha impressa: `print:text-black` porque, no tema escuro, os tokens seriam claros no papel,
 * e o espaçamento e o corpo menores no papel são para a anamnese inteira caber numa página com a assinatura.
 */
export default function RespostasDaAnamnese({ respostas }: { respostas: Respostas }) {
  const bruto: Record<string, unknown> = respostas;

  return (
    <div className="grid gap-6 print:gap-4">
      {secoes.map((secao) => (
        <section key={secao.id} className="break-inside-avoid">
          <h5 className="mb-2 text-sm font-bold text-foreground-950 print:text-black">{secao.titulo}</h5>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 print:gap-y-2">
            {secao.perguntas.map((p) => {
              const texto = leitura(p, bruto[p.id]);
              return (
                <div key={p.id}>
                  <dt className="text-sm font-medium text-foreground-500 print:text-black">{p.rotulo}</dt>
                  {/* `whitespace-pre-line`: o texto digitado com quebras de linha aparece como foi escrito. */}
                  <dd className={`mt-0.5 whitespace-pre-line print:text-sm print:text-black ${texto ? "text-foreground-950" : "text-foreground-500"}`}>
                    {texto ?? (p.tipo === "texto" ? "Não informado" : "Não respondida")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
