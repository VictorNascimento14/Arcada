// CPF no Arcada: guarda-se só os 11 dígitos (`limparCpf`) e a máscara é de exibição (`formatarCpf`).
// É dado pessoal: nunca em semente, print ou teste escrito à mão — o teste calcula os verificadores.

/** Só os dígitos: o formato de guarda e de comparação. Não corta nem confere o tamanho. */
export function limparCpf(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Máscara `000.000.000-00`, própria para aplicar a cada tecla: aceita entrada parcial e ignora o que
 * passa de 11 dígitos. O separador só aparece quando há dígito depois dele — com `123.` no fim, o
 * backspace apagaria o ponto, a máscara o devolveria e o campo não andaria mais para trás.
 */
export function formatarCpf(valor: string): string {
  const d = limparCpf(valor).slice(0, 11);
  const corpo = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(".");
  return d.length > 9 ? `${corpo}-${d.slice(9)}` : corpo;
}

/** Dígito verificador de `base` (módulo 11): pesos de `base.length + 1` até 2; resto 0 ou 1 vira 0. */
function digitoVerificador(base: number[]): number {
  const soma = base.reduce((acc, n, i) => acc + n * (base.length + 1 - i), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * CPF com ou sem máscara: 11 dígitos, os dois verificadores certos e não todos iguais. A recusa dos
 * iguais tem de ser explícita — as dez repetições (`000…`, `111…`) fecham a conta do módulo 11.
 */
export function cpfValido(valor: string): boolean {
  const d = limparCpf(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const n = Array.from(d, Number);
  return digitoVerificador(n.slice(0, 9)) === n[9] && digitoVerificador(n.slice(0, 10)) === n[10];
}
