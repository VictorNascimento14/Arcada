import { useColecao } from "@/dados/useColecao";
import { alertasDaAnamnese } from "./alertas";
import { anamneses, versoesDoPaciente } from "./dados";
import { respostasValidas } from "./questionario";

/**
 * Os alertas da anamnese mais recente do paciente, um por pílula, para o cartão da lista e a ficha de
 * pacientes usarem: `<SeloAlertas pacienteId={p.id} />`. Cada pílula só repete o que foi respondido ("Gestante",
 * "Alergia informada: penicilina"); o que fazer com o aviso é do profissional. Sem anamnese, sem alerta ou com
 * um registro que `respostasValidas` recusa (dado estragado), não desenha nada — e não derruba a lista.
 *
 * Selo ausente quer dizer "nada marcado como alerta", não "sem alergia": quem nunca preencheu a anamnese
 * também não tem selo.
 */
export default function SeloAlertas({ pacienteId }: { pacienteId: string }) {
  const ultima = versoesDoPaciente(useColecao(anamneses), pacienteId)[0];
  const alertas = ultima && respostasValidas(ultima.respostas) ? alertasDaAnamnese(ultima.respostas) : [];
  if (alertas.length === 0) return null;

  return (
    <ul aria-label="Alertas da anamnese" className="flex flex-wrap gap-1.5">
      {alertas.map((alerta) => (
        <li
          key={alerta}
          className="inline-flex max-w-full items-start gap-1 rounded-2xl bg-orange-100 px-2.5 py-1 text-xs font-semibold leading-snug text-orange-800"
        >
          <i className="ri-alert-line shrink-0" aria-hidden="true" />
          {alerta}
        </li>
      ))}
    </ul>
  );
}
