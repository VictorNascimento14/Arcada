import type { ReactNode } from "react";

type Props = {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  erro?: string;
  desabilitada?: boolean;
  children: ReactNode;
};

/** O `<select>` do sistema, com a mesma caixa dos das outras telas (`DadosDaClinica`, `MarcarConsulta`). */
export default function Selecao({ id, rotulo, valor, aoMudar, erro, desabilitada, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground-700">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        disabled={desabilitada}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        className="flex w-full items-center justify-between rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600 disabled:opacity-60"
      >
        {children}
      </select>
      {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
