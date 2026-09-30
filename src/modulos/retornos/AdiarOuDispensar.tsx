import { useState, type FormEvent } from "react";

import { dataBR } from "@/modulos/pacientes/exibicao";
import { Button, TextField, toast } from "@/ui";

import { ADIAR_MAX_DIAS, adiarRetorno, dispensarRetorno, MOTIVO_MAX } from "./dados";
import type { RetornoPendente } from "./lista";

/**
 * Adiar ou dispensar o retorno de um paciente. Os dois botões abrem, na própria linha, o campo dos dias do adiamento (sete
 * de saída) ou o do motivo da dispensa, que é obrigatório. Quem grava confere tudo (`dados.ts`); a tela só mostra o erro
 * no campo. O nome do paciente vai num `sr-only` depois do texto visível, porque a lista repete os mesmos botões.
 */
export default function AdiarOuDispensar({ retorno }: { retorno: RetornoPendente }) {
  const { pacienteId, paciente } = retorno;
  const [modo, setModo] = useState<"adiar" | "dispensar" | null>(null);
  const [dias, setDias] = useState("7");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");

  const fechar = () => {
    setModo(null);
    setErro("");
  };

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (modo === "adiar") {
      const r = adiarRetorno(pacienteId, Number(dias));
      if (!r.ok) return setErro(r.erro);
      toast("Retorno adiado", `${paciente.nome} · até ${dataBR(r.adiadoAte)}`);
    } else {
      const r = dispensarRetorno(pacienteId, motivo);
      if (!r.ok) return setErro(r.erro);
      toast("Retorno dispensado", paciente.nome);
    }
    fechar();
  }

  if (!modo) {
    return (
      <>
        <Button variant="ghost" onClick={() => setModo("adiar")}>
          Adiar <span className="sr-only">o retorno de {paciente.nome}</span>
        </Button>
        <Button variant="ghost" onClick={() => setModo("dispensar")}>
          Dispensar <span className="sr-only">o retorno de {paciente.nome}</span>
        </Button>
      </>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex w-full flex-wrap items-start gap-3 px-2 pb-1 pt-1">
      {modo === "adiar" ? (
        <TextField
          className="sm:max-w-56"
          label="Adiar por quantos dias?"
          type="number"
          inputMode="numeric"
          min={1}
          max={ADIAR_MAX_DIAS}
          value={dias}
          autoFocus
          onChange={(e) => {
            setDias(e.target.value);
            setErro("");
          }}
          error={erro}
          aria-invalid={erro ? true : undefined}
        />
      ) : (
        <TextField
          className="sm:max-w-md"
          label="Motivo da dispensa"
          hint="Sem dado de saúde: o motivo aparece na lista de dispensados."
          maxLength={MOTIVO_MAX}
          value={motivo}
          autoFocus
          onChange={(e) => {
            setMotivo(e.target.value);
            setErro("");
          }}
          error={erro}
          aria-invalid={erro ? true : undefined}
        />
      )}
      <div className="flex flex-wrap gap-2 sm:pt-[26px]">
        <Button type="submit">Confirmar</Button>
        <Button variant="ghost" onClick={fechar}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
