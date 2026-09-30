// Contato rápido: os links de WhatsApp e de ligação, a partir do telefone como o usuário o digitou
// (máscara, espaços, `+55`, zero à frente do DDD). Só número brasileiro: DDD + 8 ou 9 dígitos.

/**
 * `55` + DDD + número, só dígitos; `null` se `telefone` não for um número brasileiro utilizável — um
 * link com número errado abriria a conversa com a pessoa errada.
 *
 * O `55` só é tirado como código do país quando sobra um número inteiro depois dele (12 dígitos ou
 * mais): com 10 ou 11 dígitos, `(55) 91234-5678` tem DDD 55.
 *
 * ponytail: confere só o tamanho. DDD e prefixo inexistentes passam; validá-los pede a lista de DDDs.
 */
function normalizar(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  const semPais = digitos.length > 11 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
  const nacional = semPais.replace(/^0+/, ""); // nenhum DDD começa com zero: é o prefixo de "(011)"
  return nacional.length === 10 || nacional.length === 11 ? `55${nacional}` : null;
}

/** `https://wa.me/55…`, com `texto` (opcional) codificado na URL; `null` se o telefone não servir. */
export function linkWhatsApp(telefone: string, texto?: string): string | null {
  const numero = normalizar(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** `tel:+55…`, em formato internacional para não depender do país do aparelho; `null` se o telefone não servir. */
export function linkTelefone(telefone: string): string | null {
  const numero = normalizar(telefone);
  return numero ? `tel:+${numero}` : null;
}
