import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { planos, procedimentos } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { detalheDoItem, rotuloItens } from "@/modulos/tratamentos/exibicao";
import SituacaoBadge from "@/modulos/tratamentos/SituacaoBadge";
import { Button, diaISO, GlassCard, toast } from "@/ui";

import { aceitaRegistro, registrarRealizados } from "./realizados";

/**
 * O cartão "Procedimentos realizados" da tela do atendimento: os itens dos planos aprovados ou em andamento do
 * paciente. Os pendentes têm caixa de escolha; um botão marca os escolhidos como realizados hoje. Os já feitos
 * aparecem com a data. A gravação e as regras (inclusive a marca que o procedimento deixa no odontograma) são de
 * `registrarRealizados`.
 */
export default function ProcedimentosRealizados({ pacienteId }: { pacienteId: string }) {
  const todos = useColecao(planos);
  const catalogo = useColecao(procedimentos);
  const [escolhidos, setEscolhidos] = useState<ReadonlySet<string>>(new Set());
  // O número do plano é o da aba Tratamentos da ficha: a posição entre todos os planos do paciente.
  const abertos = useMemo(
    () => todos.filter((p) => p.pacienteId === pacienteId).flatMap((plano, i) => (aceitaRegistro(plano) ? [{ plano, numero: i + 1 }] : [])),
    [todos, pacienteId],
  );
  const nomeDe = (procedimentoId: string) => catalogo.find((p) => p.id === procedimentoId)?.nome ?? "Procedimento não encontrado";

  function alternar(itemId: string) {
    setEscolhidos((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(itemId)) novo.add(itemId);
      return novo;
    });
  }

  function registrar() {
    const dia = diaISO(new Date());
    let feitos = 0;
    let marcas = 0;
    for (const { plano } of abertos) {
      const ids = plano.itens.filter((i) => escolhidos.has(i.id) && !i.realizadoEm).map((i) => i.id);
      if (ids.length === 0) continue;
      const r = registrarRealizados(plano.id, ids, dia);
      if (!r.ok) return toast("Não foi possível registrar", r.erro);
      feitos += ids.length;
      marcas += r.marcas.length;
    }
    setEscolhidos(new Set());
    const aviso = marcas > 0 ? " O odontograma foi atualizado." : "";
    toast("Procedimentos registrados", `${rotuloItens(feitos)} ${feitos === 1 ? "realizado" : "realizados"} em ${dataBR(dia)}.${aviso}`);
  }

  return (
    <GlassCard className="p-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Procedimentos realizados</h2>
          <p className="mt-1 text-foreground-500">Escolha o que foi feito nesta consulta entre os itens dos planos aprovados ou em andamento.</p>
        </div>
        <Button onClick={registrar} disabled={escolhidos.size === 0}>
          Marcar como realizados
        </Button>
      </div>

      {abertos.length === 0 ? (
        <p className="mt-6 text-foreground-500">
          Este paciente não tem plano aprovado ou em andamento.{" "}
          <Link to={`/pacientes/${pacienteId}`} className="font-medium text-primary-800 hover:underline">
            Abra a ficha
          </Link>{" "}
          para aprovar um plano na aba Tratamentos.
        </p>
      ) : (
        abertos.map(({ plano, numero }) => (
          <div key={plano.id} className="mt-5">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground-950">Plano {numero}</h3>
              <SituacaoBadge situacao={plano.situacao} />
            </div>
            <ul className="mt-2 divide-y divide-foreground-950/[0.06]">
              {plano.itens.map((item) => {
                const detalhe = detalheDoItem(item);
                const nome = nomeDe(item.procedimentoId);
                return (
                  <li key={item.id} className="py-3">
                    {item.realizadoEm ? (
                      <div className="flex flex-wrap items-center gap-x-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground-950">{nome}</p>
                          {detalhe && <p className="text-sm text-foreground-500">{detalhe}</p>}
                        </div>
                        <p className="text-sm font-medium text-foreground-600">Realizado em {dataBR(item.realizadoEm)}</p>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={escolhidos.has(item.id)}
                          onChange={() => alternar(item.id)}
                          className="h-5 w-5 shrink-0 accent-primary-800"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-foreground-950">{nome}</span>
                          {detalhe && <span className="block text-sm text-foreground-500">{detalhe}</span>}
                        </span>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </GlassCard>
  );
}
