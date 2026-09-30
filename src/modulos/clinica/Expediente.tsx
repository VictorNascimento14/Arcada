import { useId, useState, type FormEvent } from "react";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { DiaDaSemana } from "@/dominio";
import { Button, GlassCard, TextField, toast } from "@/ui";

import { camposDoExpediente, DIAS, salvarExpediente, type CamposDoDia, type CamposDoExpediente, type ErrosDoExpediente } from "./expediente";

/** O cartão do expediente: os sete dias da semana, cada um aberto (com os horários) ou fechado. */
export default function ExpedienteDaClinica() {
  const atual = useColecao(clinica).find((c) => c.id === CLINICA_ID);
  const base = useId();
  const [campos, setCampos] = useState<CamposDoExpediente>(() => camposDoExpediente(atual?.expediente));
  const [erros, setErros] = useState<ErrosDoExpediente>({});

  const editar = (dia: DiaDaSemana, parte: Partial<CamposDoDia>) => setCampos((c) => ({ ...c, [dia]: { ...c[dia], ...parte } }));

  function salvar(e: FormEvent) {
    e.preventDefault();
    const novos = salvarExpediente(campos);
    setErros(novos);
    if (Object.keys(novos).length === 0) toast("Expediente salvo");
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Expediente</h2>
      <p className="mt-1 text-foreground-500">
        Os dias e horários em que a clínica atende: a agenda só sugere vagas dentro deles. O intervalo (almoço) é opcional; deixe os dois
        horários em branco se o dia não tem.
      </p>

      <form onSubmit={salvar} noValidate className="mt-4">
        <div className="divide-y divide-foreground-950/[0.06]">
          {DIAS.map(({ dia, nome }) => {
            const d = campos[dia];
            const e = erros[dia] ?? {};
            const idDoNome = `${base}-${dia}`;
            const horario = (parte: keyof CamposDoDia) => (ev: { target: { value: string } }) => editar(dia, { [parte]: ev.target.value });
            return (
              <div key={dia} role="group" aria-labelledby={idDoNome} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p id={idDoNome} className="font-semibold text-foreground-950">
                    {nome}
                  </p>
                  <label className="flex items-center gap-2 text-sm text-foreground-700">
                    <input
                      type="checkbox"
                      checked={d.aberto}
                      onChange={(ev) => editar(dia, { aberto: ev.target.checked })}
                      className="h-4 w-4 accent-primary-800"
                    />
                    Aberto
                  </label>
                </div>
                {d.aberto && (
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <TextField label="Abertura" type="time" value={d.abertura} onChange={horario("abertura")} error={e.abertura} aria-invalid={e.abertura ? true : undefined} />
                    <TextField label="Fechamento" type="time" value={d.fechamento} onChange={horario("fechamento")} error={e.fechamento} aria-invalid={e.fechamento ? true : undefined} />
                    <TextField label="Início do intervalo" type="time" value={d.intervaloInicio} onChange={horario("intervaloInicio")} aria-invalid={e.intervalo ? true : undefined} />
                    <TextField label="Fim do intervalo" type="time" value={d.intervaloFim} onChange={horario("intervaloFim")} aria-invalid={e.intervalo ? true : undefined} />
                    {e.intervalo && <p className="col-span-2 text-xs text-red-600 md:col-span-4">{e.intervalo}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {Object.keys(erros).length > 0 && (
            <p role="alert" className="text-sm text-red-600">
              Revise os dias destacados.
            </p>
          )}
          <Button type="submit">Salvar expediente</Button>
        </div>
      </form>
    </GlassCard>
  );
}
