import { useId, useMemo, useState, type FormEvent } from "react";

import { profissionais } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, GlassCard, toast } from "@/ui";

import { evolucoes, registrarEvolucao } from "./dados";

/**
 * O cartão "Evolução clínica" da tela do atendimento: um campo de texto livre e, abaixo, as evoluções desta
 * consulta, da mais recente à mais antiga, com o dia e o profissional. O campo nasce vazio, sem modelo nem texto
 * sugerido: o que se escreve é do profissional. A gravação e as regras são de `registrarEvolucao`.
 */
export default function EvolucaoClinica({ consultaId }: { consultaId: string }) {
  const campo = useId();
  const todas = useColecao(evolucoes);
  const equipe = useColecao(profissionais);
  const [texto, setTexto] = useState("");
  // `filter` devolve um array novo: o `reverse` não mexe na lista da coleção.
  const daConsulta = useMemo(() => todas.filter((e) => e.consultaId === consultaId).reverse(), [todas, consultaId]);

  function registrar(evento: FormEvent) {
    evento.preventDefault();
    const r = registrarEvolucao(consultaId, texto);
    if (!r.ok) return toast("Não foi possível registrar a evolução", r.erro);
    setTexto("");
    toast("Evolução registrada", `Escrita em ${dataBR(r.evolucao.dia)}.`);
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Evolução clínica</h2>
      <p className="mt-1 text-foreground-500">Registre, em texto livre, o que aconteceu nesta consulta. O texto é seu: o Arcada não sugere nada.</p>

      <form onSubmit={registrar} className="mt-4">
        <label htmlFor={campo} className="mb-1.5 block text-sm font-medium text-foreground-700">
          Evolução
        </label>
        <textarea
          id={campo}
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full rounded-[22px] border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={!texto.trim()}>
            Registrar evolução
          </Button>
        </div>
      </form>

      {daConsulta.length === 0 ? (
        <p className="mt-6 text-foreground-500">Nenhuma evolução registrada nesta consulta.</p>
      ) : (
        <ul className="mt-6 divide-y divide-foreground-950/[0.06]">
          {daConsulta.map((e) => (
            <li key={e.id} className="py-3">
              <p className="text-sm font-medium text-foreground-500">{`${dataBR(e.dia)} · ${equipe.find((p) => p.id === e.profissionalId)?.nome ?? "Profissional removido"}`}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-foreground-950">{e.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
