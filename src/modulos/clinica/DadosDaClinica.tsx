import { useState, type FormEvent } from "react";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import { Button, GlassCard, TextField, toast } from "@/ui";

import { camposDaClinica, LIMITES, salvarDadosDaClinica, type CamposDaClinica, type ErrosDaClinica } from "./dadosDaClinica";
import { UFS } from "./cro";

/** O cartão com nome, telefone, endereço e cidade/UF da clínica: é o que sai no cabeçalho impresso. */
export default function DadosDaClinica() {
  const atual = useColecao(clinica).find((c) => c.id === CLINICA_ID);
  const [campos, setCampos] = useState<CamposDaClinica>(() => camposDaClinica(atual));
  const [erros, setErros] = useState<ErrosDaClinica>({});

  const editar = (campo: keyof CamposDaClinica) => (e: { target: { value: string } }) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));
  const invalido = (campo: keyof CamposDaClinica) => (erros[campo] ? true : undefined);

  function salvar(e: FormEvent) {
    e.preventDefault();
    const novos = salvarDadosDaClinica(campos);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    setCampos(camposDaClinica(clinica.obter(CLINICA_ID))); // mostra o que ficou salvo (espaços aparados)
    toast("Dados da clínica salvos");
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Dados da clínica</h2>
      <p className="mt-1 text-foreground-500">Saem no cabeçalho dos documentos impressos.</p>

      <form onSubmit={salvar} noValidate className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField
          className="md:col-span-2"
          label="Nome da clínica"
          value={campos.nome}
          onChange={editar("nome")}
          error={erros.nome}
          aria-invalid={invalido("nome")}
          maxLength={LIMITES.nome}
          autoComplete="organization"
        />
        <TextField
          label="Telefone"
          type="tel"
          inputMode="tel"
          value={campos.telefone}
          onChange={editar("telefone")}
          error={erros.telefone}
          aria-invalid={invalido("telefone")}
          maxLength={LIMITES.telefone}
          autoComplete="tel"
        />
        <TextField
          label="Endereço"
          value={campos.endereco}
          onChange={editar("endereco")}
          error={erros.endereco}
          aria-invalid={invalido("endereco")}
          maxLength={LIMITES.endereco}
          autoComplete="street-address"
        />
        <div className="grid grid-cols-[1fr_7rem] gap-4 md:col-span-2">
          <TextField
            label="Cidade"
            value={campos.cidade}
            onChange={editar("cidade")}
            error={erros.cidade}
            aria-invalid={invalido("cidade")}
            maxLength={LIMITES.cidade}
            autoComplete="address-level2"
          />
          <div>
            <label htmlFor="clinica-uf" className="mb-1.5 block text-sm font-medium text-foreground-700">
              UF
            </label>
            <select
              id="clinica-uf"
              value={campos.uf}
              onChange={editar("uf")}
              aria-invalid={invalido("uf")}
              className="flex w-full items-center justify-between rounded-full border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 hover:border-foreground-950/25 focus:border-primary-600"
            >
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            {erros.uf && <p className="mt-1.5 text-xs text-red-600">{erros.uf}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 md:col-span-2">
          {Object.keys(erros).length > 0 && (
            <p role="alert" className="text-sm text-red-600">
              Revise os campos destacados.
            </p>
          )}
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </GlassCard>
  );
}
