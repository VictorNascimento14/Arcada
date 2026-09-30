import { useId, useState, type ChangeEvent, type FormEvent } from "react";

import { Button, diaISO, TextField } from "@/ui";
import { formatarCpf } from "./cpf";
import { DADOS_EM_BRANCO, LIMITES, NASCIMENTO_MINIMO, validarPaciente, type DadosPaciente } from "./regras";

type Props = {
  /** Chamado com os dados quando o formulário passa na validação. Quem grava é quem chama. */
  aoEnviar: (dados: DadosPaciente) => void;
  aoCancelar: () => void;
};

/**
 * Os campos do paciente. As mensagens vêm de `validarPaciente`, as mesmas da regra de escrita, e só
 * aparecem depois da primeira tentativa de enviar.
 */
export default function FormularioPaciente({ aoEnviar, aoCancelar }: Props) {
  const [dados, setDados] = useState<DadosPaciente>(DADOS_EM_BRANCO);
  const [tentou, setTentou] = useState(false);
  const idObservacoes = useId();
  const hoje = diaISO(new Date());
  const erros = tentou ? validarPaciente(dados, hoje) : {};

  const mudar = (campo: keyof DadosPaciente) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = campo === "cpf" ? formatarCpf(e.target.value) : e.target.value; // máscara a cada tecla
    setDados((d) => ({ ...d, [campo]: valor }));
  };

  // `autoComplete="off"`: o navegador ofereceria o nome, o telefone e o e-mail de quem está usando o app
  // para preencher os dados do paciente.
  const campo = (nome: keyof DadosPaciente) => ({
    name: nome,
    value: dados[nome],
    onChange: mudar(nome),
    error: erros[nome],
    "aria-invalid": erros[nome] ? true : undefined,
    autoComplete: "off",
  });

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const primeiroErro = Object.keys(validarPaciente(dados, hoje))[0]; // na ordem dos campos da tela
    setTentou(true);
    if (primeiroErro) {
      (e.currentTarget.elements.namedItem(primeiroErro) as HTMLElement | null)?.focus();
      return;
    }
    aoEnviar(dados);
  }

  return (
    // `noValidate`: as mensagens são as do app, em português e iguais em todo navegador.
    <form noValidate onSubmit={enviar} className="mt-6 grid gap-4 md:grid-cols-2">
      <TextField className="md:col-span-2" label="Nome completo" required maxLength={LIMITES.nome} {...campo("nome")} />
      <TextField
        label="Data de nascimento"
        type="date"
        required
        min={NASCIMENTO_MINIMO}
        max={hoje}
        {...campo("nascimento")}
      />
      <TextField label="CPF (opcional)" inputMode="numeric" maxLength={14} placeholder="000.000.000-00" {...campo("cpf")} />
      <TextField
        label="Telefone"
        type="tel"
        inputMode="tel"
        maxLength={20}
        placeholder="(00) 00000-0000"
        {...campo("telefone")}
      />
      <TextField label="E-mail" type="email" maxLength={LIMITES.email} placeholder="paciente@exemplo.com" {...campo("email")} />
      <TextField
        className="md:col-span-2"
        label="Convênio"
        maxLength={LIMITES.convenio}
        hint="Em branco, o paciente é particular."
        {...campo("convenio")}
      />

      <div className="md:col-span-2">
        <label htmlFor={idObservacoes} className="mb-1.5 block text-sm font-medium text-foreground-700">
          Observações
        </label>
        <textarea
          id={idObservacoes}
          name="observacoes"
          rows={4}
          maxLength={LIMITES.observacoes}
          value={dados.observacoes}
          onChange={mudar("observacoes")}
          aria-invalid={erros.observacoes ? true : undefined}
          className="w-full rounded-[22px] border border-foreground-950/[0.10] bg-surface/70 px-[18px] py-3 text-sm text-foreground-950 backdrop-blur-sm transition-colors duration-200 placeholder:text-foreground-400 hover:border-foreground-950/25 focus:border-primary-600"
        />
        {erros.observacoes && <p className="mt-1.5 text-xs text-red-600">{erros.observacoes}</p>}
      </div>

      {/* Quem usa leitor de tela ouve todos os erros de uma vez; quem enxerga já tem cada um no seu campo. */}
      {Object.keys(erros).length > 0 && (
        <p role="alert" className="sr-only">
          {Object.values(erros).join(" ")}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
        <Button variant="ghost" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit">Cadastrar paciente</Button>
      </div>
    </form>
  );
}
