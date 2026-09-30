import { useNavigate } from "react-router-dom";

import { mudarSituacao } from "@/modulos/agenda/mudarSituacao";
import { Button, toast } from "@/ui";

const ACAO = "Iniciar atendimento";

/**
 * "Iniciar atendimento": leva a consulta para `em-atendimento` pela regra de situação da agenda e abre a tela do
 * atendimento. Quem decide se pode é `mudarSituacao` (confere `podeTransitar` na hora de gravar); a tela só
 * oferece o botão onde a agenda já permite. `contexto` (o dia e a hora da linha) entra no nome acessível: numa
 * lista, vários botões diriam a mesma coisa.
 */
export default function BotaoIniciarAtendimento({ consultaId, contexto }: { consultaId: string; contexto?: string }) {
  const navigate = useNavigate();

  function iniciar() {
    const r = mudarSituacao(consultaId, "em-atendimento");
    if (!r.ok) return toast("Não foi possível iniciar o atendimento", r.erro);
    navigate(`/atendimento/${consultaId}`);
  }

  return (
    <Button onClick={iniciar} aria-label={contexto ? `${ACAO} de ${contexto}` : undefined}>
      {ACAO}
    </Button>
  );
}
