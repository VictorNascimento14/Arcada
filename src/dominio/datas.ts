// Data no domínio é `string`, não `Date`: o dado vai e volta do `localStorage` como JSON, e um `Date`
// voltaria como texto. Os três formatos são no horário LOCAL, sem fuso, e ordenam como o calendário —
// comparar as strings já compara as datas.
//
// O dia de hoje sai de `diaISO` (`@/ui`), nunca de `toISOString()`: ele converte para UTC e, à noite,
// no Brasil, já devolve o dia seguinte.

/** Dia do calendário, `AAAA-MM-DD` (ex.: `2026-09-30`). */
export type DataISO = string;

/** Hora do dia, `HH:mm` em 24 h (ex.: `08:30`). */
export type HoraISO = string;

/** Dia e hora, `AAAA-MM-DDTHH:mm` (ex.: `2026-09-30T08:30`). */
export type DataHoraISO = string;
