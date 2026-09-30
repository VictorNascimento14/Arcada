import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sem `globals: true`, a Testing Library não registra a limpeza sozinha: cada
// teste herdaria o DOM do anterior.
afterEach(cleanup);

// O jsdom não implementa `matchMedia` nem `IntersectionObserver`, e o kit usa os
// dois (tema, movimento reduzido, `useInView`). Sem os dublês, a casca nem monta.
if (!window.matchMedia) {
  window.matchMedia = (media: string) =>
    ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

const w = window as unknown as { IntersectionObserver?: unknown };
if (!w.IntersectionObserver) {
  class Observador {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  w.IntersectionObserver = Observador;
}
