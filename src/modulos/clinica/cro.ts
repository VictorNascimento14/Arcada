/**
 * Registro no CRO (Conselho Regional de Odontologia), no padrão `CRO-SP 12345`.
 *
 * Só o formato: um número bem formado pode não existir no conselho — o app não o consulta.
 */

/** As 27 unidades da federação, em ordem alfabética: cada uma tem o seu CRO (o do Distrito Federal incluso). */
export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

const SIGLAS: ReadonlySet<string> = new Set(UFS);

// A forma canônica: "CRO-", a UF, um espaço e de 1 a 6 dígitos (zeros à esquerda valem).
const CANONICO = /^CRO-([A-Z]{2}) \d{1,6}$/;
// O que se digita na prática: "cro sp 12345", "CRO/SP 12345", "SP 12345", "CRO-SP12345".
const DIGITADO = /^(?:CRO)?[\s/-]*([A-Z]{2})[\s/-]*(\d{1,6})$/i;

/** Confere só a forma canônica que `formatarCro` produz; texto digitado passa antes por `formatarCro`. */
export function croValido(texto: string): boolean {
  const uf = CANONICO.exec(texto)?.[1];
  return uf !== undefined && SIGLAS.has(uf);
}

/**
 * Leva o que foi digitado à forma `CRO-SP 12345`. Se não reconhece uma UF e um número,
 * devolve o texto aparado, sem mexer — o `croValido` recusa depois.
 */
export function formatarCro(texto: string): string {
  const aparado = texto.trim();
  const m = DIGITADO.exec(aparado);
  const candidato = m ? `CRO-${m[1].toUpperCase()} ${m[2]}` : "";
  return croValido(candidato) ? candidato : aparado;
}
