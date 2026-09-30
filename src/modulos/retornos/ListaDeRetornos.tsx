import { useMemo } from "react";
import { Link } from "react-router-dom";

import { consultas, pacientes, planos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Avatar, GlassCard, diaISO } from "@/ui";

import AdiarOuDispensar from "./AdiarOuDispensar";
import ContatoDoRetorno from "./ContatoDoRetorno";
import { retornos } from "./dados";
import Dispensados from "./Dispensados";
import { JANELA_A_VENCER_DIAS, retornosDispensados, retornosPendentes, type RetornoPendente } from "./lista";

const nDias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

// Três tons: vencido, vence hoje e a vencer. A cor ajuda; quem diz é o texto.
const COR_DO_PRAZO = {
  vencido: "bg-red-100 text-red-700",
  hoje: "bg-accent-100 text-accent-800",
  "a-vencer": "bg-secondary-100 text-secondary-800",
};

function Prazo({ situacao, dias }: Pick<RetornoPendente, "situacao" | "dias">) {
  const hoje = situacao === "a-vencer" && dias === 0;
  const texto = situacao === "vencido" ? `Vencido há ${nDias(dias)}` : hoje ? "Vence hoje" : `Vence em ${nDias(dias)}`;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COR_DO_PRAZO[hoje ? "hoje" : situacao]}`}>
      {texto}
    </span>
  );
}

type SecaoProps = { titulo: string; descricao: string; vazio: string; linhas: RetornoPendente[] };

function Secao({ titulo, descricao, vazio, linhas }: SecaoProps) {
  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">{titulo}</h2>
      <p className="mt-1 text-foreground-500">{descricao}</p>

      {linhas.length === 0 ? (
        <p className="mt-6 text-foreground-500">{vazio}</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-foreground-500">
            {linhas.length} {linhas.length === 1 ? "paciente" : "pacientes"}
          </p>
          <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
            {linhas.map((r) => (
              <li key={r.pacienteId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                  <span aria-hidden="true">
                    <Avatar nome={r.paciente.nome} size={40} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground-950">
                      <Link to={`/pacientes/${r.pacienteId}`} className="hover:underline">
                        {r.paciente.nome}
                      </Link>
                    </p>
                    <p className="text-sm text-foreground-500">
                      Último atendimento em {dataBR(r.ultimoAtendimento)} · retorno {r.adiado ? "adiado para" : "previsto em"} {dataBR(r.retornoEm)}
                    </p>
                  </div>
                </div>
                <Prazo situacao={r.situacao} dias={r.dias} />
                <div role="group" aria-label={`Ações do retorno de ${r.paciente.nome}`} className="flex w-full flex-wrap items-center gap-1">
                  <ContatoDoRetorno paciente={r.paciente} />
                  <AdiarOuDispensar retorno={r} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  );
}

/** Os retornos que pedem contato: os vencidos e os dos próximos 30 dias, cada grupo em seu cartão, e o cartão dos dispensados, se houver algum. */
export default function ListaDeRetornos() {
  const todosPacientes = useColecao(pacientes);
  const todasConsultas = useColecao(consultas);
  const todosPlanos = useColecao(planos);
  const estados = useColecao(retornos);
  // ponytail: o dia é o da última renderização; a tela aberta na virada da meia-noite só corrige os prazos ao se redesenhar. Se pesar, um relógio que renove ao virar o dia.
  const hoje = diaISO(new Date());
  const pendentes = useMemo(
    () => retornosPendentes(todosPacientes, todasConsultas, todosPlanos, hoje, estados),
    [todosPacientes, todasConsultas, todosPlanos, hoje, estados],
  );
  const dispensados = useMemo(
    () => retornosDispensados(todosPacientes, todasConsultas, todosPlanos, estados),
    [todosPacientes, todasConsultas, todosPlanos, estados],
  );

  return (
    <>
      <Secao
        titulo="Vencidos"
        descricao="Pacientes que já deviam ter voltado, do prazo mais antigo ao mais recente."
        vazio="Nenhum retorno vencido."
        linhas={pendentes.filter((r) => r.situacao === "vencido")}
      />
      <Secao
        titulo={`A vencer nos próximos ${JANELA_A_VENCER_DIAS} dias`}
        descricao="Pacientes que devem voltar em breve, do prazo mais próximo ao mais distante."
        vazio={`Nenhum retorno a vencer nos próximos ${JANELA_A_VENCER_DIAS} dias.`}
        linhas={pendentes.filter((r) => r.situacao === "a-vencer")}
      />
      {dispensados.length > 0 && <Dispensados dispensados={dispensados} />}
    </>
  );
}
