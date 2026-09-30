import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { SEMEADORES } from "./dados/semeadores";
import { carregarSementes } from "./dados/sementes";
import "./ui/index.css";

// Antes do primeiro render: as telas leem as coleções de forma síncrona.
carregarSementes(SEMEADORES);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
