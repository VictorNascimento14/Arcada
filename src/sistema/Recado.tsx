import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { BrandMark, GlassCard, Reveal, stagger } from "@/ui";

interface RecadoProps {
  emoji: string;
  titulo: string;
  texto: string;
  acoes?: ReactNode;
}

/**
 * Tela cheia para quando algo sai do caminho (404, erro). Fora da coluna: pode
 * aparecer justamente porque a casca quebrou.
 */
export default function Recado({ emoji, titulo, texto, acoes }: RecadoProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary-300/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-secondary-300/30 blur-3xl"
      />
      <div className="relative w-full max-w-md text-center">
        <Reveal className="flex justify-center">
          <BrandMark size={36} showWordmark />
        </Reveal>
        <GlassCard tone="strong" className="mt-6 p-9" delay={stagger(1)}>
          <span className="animate-pop inline-block text-[56px] leading-none" aria-hidden="true">
            {emoji}
          </span>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.02em] text-foreground-950">{titulo}</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-foreground-600">{texto}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {acoes ?? (
              <Link
                to="/"
                className="press inline-flex items-center gap-2 rounded-full bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-50 shadow-nav-active transition-colors hover:bg-primary-800"
              >
                <i className="ri-home-5-line" aria-hidden="true" />
                Voltar ao painel
              </Link>
            )}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
