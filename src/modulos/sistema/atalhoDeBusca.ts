// O elo entre quem pede a busca (um botão) e o `BuscaGlobal` montado: um evento na janela, para o botão não precisar
// enxergar o componente nem o estado dele.

/** O evento que o `BuscaGlobal` escuta, além do atalho de teclado. */
export const EVENTO_BUSCAR = "arcada:buscar";

/** Abre a busca global (a instância montada que responde ao atalho). Sem nenhuma montada, não faz nada. */
export function abrirBusca(): void {
  window.dispatchEvent(new Event(EVENTO_BUSCAR));
}
