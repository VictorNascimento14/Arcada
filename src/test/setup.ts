import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sem `globals: true`, a Testing Library não registra a limpeza sozinha: cada
// teste herdaria o DOM do anterior.
afterEach(cleanup);
