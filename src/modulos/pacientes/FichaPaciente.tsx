import { useEffect, useId, useState, type ComponentType, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { NAVEGACAO } from "@/modulos";
import SeloAlertas from "@/modulos/anamnese/SeloAlertas";
import { Avatar, diaISO, GlassCard, PageShell, usePrefersReducedMotion } from "@/ui";
import { linkTelefone, linkWhatsApp } from "./contato";
import DadosDoPaciente from "./DadosDoPaciente";
import { anosDoPaciente, rotuloConvenio, rotuloIdade } from "./exibicao";

type Aba = { chave: string; rotulo: string; Componente: ComponentType<{ pacienteId: string }> };

const ABA_DADOS: Aba = { chave: "dados", rotulo: "Dados", Componente: DadosDoPaciente };

// Os botões de contato são links com a cara do `Button` secundário: navegar é `<a>`, e o kit não tem botão-link.
const BOTAO_CONTATO =
  "press inline-flex items-center justify-center gap-2 rounded-full bg-secondary-100 px-5 py-3 text-sm font-semibold whitespace-nowrap text-secondary-800 transition-colors hover:bg-secondary-200";

/**
 * `/pacientes/:id`: o cabeçalho do paciente e as abas. A primeira é a "Dados", do próprio módulo; as
 * outras são as que cada módulo registra em `abaPaciente` (anamnese, odontograma…): a ficha não as conhece.
 */
export default function FichaPaciente() {
  const { id } = useParams();
  const paciente = useColecao(pacientes).find((p) => p.id === id);
  const [ativa, setAtiva] = useState(ABA_DADOS.chave);
  const base = useId();
  const reduzido = usePrefersReducedMotion();

  // No celular a barra de abas rola na horizontal: a aba ativa (toque na ponta ou setas) entra inteira na tela.
  // `?.` no método: o jsdom não tem `scrollIntoView`.
  useEffect(() => {
    document
      .getElementById(`${base}-aba-${ativa}`)
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: reduzido ? "auto" : "smooth" });
  }, [ativa, base, reduzido]);

  if (!paciente) {
    return (
      <PageShell titulo="Ficha do paciente">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
          <GlassCard className="p-[26px] text-center">
            <h2 className="text-xl font-bold text-foreground-950">Paciente não encontrado</h2>
            <p className="mt-1 text-foreground-500">Este endereço não corresponde a nenhum paciente cadastrado.</p>
            <Link
              to="/pacientes"
              className="press mt-5 inline-flex items-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
            >
              Voltar à lista de pacientes
            </Link>
          </GlassCard>
        </main>
      </PageShell>
    );
  }

  // Lido aqui, e não no topo do arquivo: `@/modulos` importa o `modulo.ts` deste módulo, que importa esta tela.
  const abas: Aba[] = [ABA_DADOS, ...NAVEGACAO.abasPaciente];
  const atual = abas.find((a) => a.chave === ativa) ?? ABA_DADOS;
  const anos = anosDoPaciente(paciente, diaISO(new Date()));
  const whatsapp = linkWhatsApp(paciente.telefone);
  const ligar = linkTelefone(paciente.telefone);

  // Setas, Home e End movem a seleção e o foco (ativação automática, como no padrão WAI-ARIA de abas).
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const i = abas.indexOf(atual);
    const destinos: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 };
    const destino = destinos[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const proxima = abas[(destino + abas.length) % abas.length]; // dá a volta nas pontas
    setAtiva(proxima.chave);
    document.getElementById(`${base}-aba-${proxima.chave}`)?.focus();
  }

  return (
    <PageShell titulo="Ficha do paciente" detalhe={paciente.nome}>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6 md:pb-10">
        <GlassCard className="flex flex-wrap items-center gap-x-5 gap-y-4 p-5 md:p-[26px]">
          <span aria-hidden="true">
            <Avatar nome={paciente.nome} size={64} />
          </span>
          <div className="min-w-[12rem] flex-1">
            <h2 className="truncate text-2xl font-bold tracking-[-0.01em] text-foreground-950">{paciente.nome}</h2>
            <p className="mt-0.5 text-foreground-500">
              {anos === null ? rotuloConvenio(paciente) : `${rotuloIdade(anos)} · ${rotuloConvenio(paciente)}`}
            </p>
            {paciente.telefone && <p className="text-foreground-500">{paciente.telefone}</p>}
            {/* Os alertas da última anamnese salva; sem alerta, o `empty:hidden` não deixa espaço. */}
            <div className="mt-2 empty:hidden">
              <SeloAlertas pacienteId={paciente.id} />
            </div>
          </div>
          {(whatsapp || ligar) && (
            <div className="flex flex-wrap gap-2">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={BOTAO_CONTATO}>
                  <i className="ri-whatsapp-line" aria-hidden="true" />
                  WhatsApp
                  <span className="sr-only">, abre em outra aba</span>
                </a>
              )}
              {ligar && (
                <a href={ligar} className={BOTAO_CONTATO}>
                  <i className="ri-phone-line" aria-hidden="true" />
                  Ligar
                </a>
              )}
            </div>
          )}
        </GlassCard>

        {/* `p-1`: o anel de foco (2px + 2px de respiro) seria cortado pela rolagem horizontal. */}
        <div
          role="tablist"
          aria-label="Seções da ficha"
          onKeyDown={aoTeclar}
          className="scrollbar-hide -mx-1 mt-5 flex gap-1 overflow-x-auto p-1"
        >
          {abas.map((aba) => {
            const selecionada = aba === atual;
            return (
              <button
                key={aba.chave}
                type="button"
                role="tab"
                id={`${base}-aba-${aba.chave}`}
                aria-selected={selecionada}
                aria-controls={selecionada ? `${base}-painel` : undefined}
                tabIndex={selecionada ? 0 : -1}
                onClick={() => setAtiva(aba.chave)}
                className={`press shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selecionada
                    ? "bg-primary-900 text-primary-50 shadow-nav-active"
                    : "text-foreground-600 hover:bg-primary-900/[0.07] hover:text-primary-900"
                }`}
              >
                {aba.rotulo}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`${base}-painel`} aria-labelledby={`${base}-aba-${atual.chave}`} tabIndex={0} className="mt-4">
          <atual.Componente pacienteId={paciente.id} />
        </div>
      </main>
    </PageShell>
  );
}
