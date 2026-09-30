/** Id novo (UUID v4) para item de coleção. */
export function novoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // `randomUUID` só existe em contexto seguro (https e localhost). No celular, abrindo o
  // servidor de desenvolvimento por http na rede local, sobra o `getRandomValues`.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versão 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
