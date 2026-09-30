import Recado from "./Recado";

export default function NaoEncontrada() {
  return (
    <Recado
      emoji="🦷"
      titulo="Esta página não existe"
      texto="O endereço pode ter mudado ou veio com um erro de digitação. O painel do consultório continua aqui."
    />
  );
}
