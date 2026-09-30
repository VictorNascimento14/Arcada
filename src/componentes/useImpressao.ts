import { useEffect, useState } from "react";

/**
 * O mecanismo de impressão do app, para quem imprime uma `FolhaImpressa`. `imprimir(dados)` guarda os dados e
 * `folha` passa a tê-los: a tela renderiza a folha enquanto `folha` não for `null`. O efeito então liga o modo de
 * impressão do kit (`<body data-print-mode="clone">`, em `src/ui/index.css`: só o `[data-print-clone]` sai no papel)
 * e abre o diálogo do navegador. O `afterprint` desfaz tudo e a folha some; sair da tela com ela no ar também
 * desliga o modo.
 *
 * Cada chamada guarda um objeto novo, então imprimir os mesmos dados de novo refaz o efeito, mesmo sem `afterprint`.
 * Não tira a folha logo depois do `window.print()`: no celular ele volta antes de a impressão ler a página.
 */
export function useImpressao<T>(): { folha: T | null; imprimir: (dados: T) => void } {
  const [pedido, setPedido] = useState<{ dados: T } | null>(null);

  useEffect(() => {
    if (!pedido) return;
    const limpar = () => setPedido(null);
    document.body.dataset.printMode = "clone";
    window.addEventListener("afterprint", limpar);
    window.print();
    return () => {
      window.removeEventListener("afterprint", limpar);
      delete document.body.dataset.printMode;
    };
  }, [pedido]);

  return { folha: pedido ? pedido.dados : null, imprimir: (dados) => setPedido({ dados }) };
}
