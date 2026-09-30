// O catálogo padrão de procedimentos: a tabela que a clínica recebe na primeira abertura (`sementes.ts`), para
// ter preços a editar em vez de uma lista vazia. Só demonstração: os preços são fictícios, em centavos, e o
// código é próprio da clínica (sigla da especialidade e número: `PRE-02`) — não é o da TUSS.
//
// `condicaoResultante` é o `id` de uma condição do odontograma (`src/modulos/odontograma/condicoes.ts`). Quem
// deixa condição de face (restauração, selante) exige a face; as de dente inteiro, só o dente. Fica sem ela o
// que não muda a marca do dente: enxerto, núcleo e a coroa sobre implante (o dente já consta como implante).

import type { Procedimento } from "@/dominio";

/** As áreas do catálogo padrão, na ordem em que a lista e o filtro as mostram. */
export const ESPECIALIDADES = [
  "Prevenção",
  "Dentística",
  "Endodontia",
  "Periodontia",
  "Cirurgia",
  "Prótese",
  "Implantodontia",
  "Ortodontia",
] as const;

export const CATALOGO: readonly Procedimento[] = [
  // Prevenção
  { id: "proc-consulta-avaliacao", codigo: "PRE-01", nome: "Consulta de avaliação", especialidade: "Prevenção", preco: 12000, duracaoMin: 30, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-profilaxia", codigo: "PRE-02", nome: "Profilaxia (limpeza)", especialidade: "Prevenção", preco: 18000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-fluor-topico", codigo: "PRE-03", nome: "Aplicação tópica de flúor", especialidade: "Prevenção", preco: 9000, duracaoMin: 20, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-selante", codigo: "PRE-04", nome: "Selante de fossas e fissuras", especialidade: "Prevenção", preco: 11000, duracaoMin: 30, exigeDente: true, exigeFace: true, condicaoResultante: "selante", ativo: true },
  { id: "proc-radiografia-periapical", codigo: "PRE-05", nome: "Radiografia periapical", especialidade: "Prevenção", preco: 4500, duracaoMin: 10, exigeDente: true, exigeFace: false, ativo: true },

  // Dentística
  { id: "proc-restauracao-resina", codigo: "DEN-01", nome: "Restauração em resina composta", especialidade: "Dentística", preco: 22000, duracaoMin: 50, exigeDente: true, exigeFace: true, condicaoResultante: "restauracao", ativo: true },
  { id: "proc-restauracao-ionomero", codigo: "DEN-02", nome: "Restauração em ionômero de vidro", especialidade: "Dentística", preco: 16000, duracaoMin: 40, exigeDente: true, exigeFace: true, condicaoResultante: "restauracao", ativo: true },
  { id: "proc-clareamento-consultorio", codigo: "DEN-03", nome: "Clareamento de consultório", especialidade: "Dentística", preco: 80000, duracaoMin: 60, exigeDente: false, exigeFace: false, ativo: true },

  // Endodontia
  { id: "proc-canal-unirradicular", codigo: "END-01", nome: "Tratamento de canal, dente unirradicular", especialidade: "Endodontia", preco: 60000, duracaoMin: 90, exigeDente: true, exigeFace: false, condicaoResultante: "tratamentoDeCanal", ativo: true },
  { id: "proc-canal-birradicular", codigo: "END-02", nome: "Tratamento de canal, dente birradicular", especialidade: "Endodontia", preco: 80000, duracaoMin: 100, exigeDente: true, exigeFace: false, condicaoResultante: "tratamentoDeCanal", ativo: true },
  { id: "proc-canal-multirradicular", codigo: "END-03", nome: "Tratamento de canal, dente multirradicular", especialidade: "Endodontia", preco: 100000, duracaoMin: 120, exigeDente: true, exigeFace: false, condicaoResultante: "tratamentoDeCanal", ativo: true },
  { id: "proc-retratamento-canal", codigo: "END-04", nome: "Retratamento de canal", especialidade: "Endodontia", preco: 120000, duracaoMin: 120, exigeDente: true, exigeFace: false, condicaoResultante: "tratamentoDeCanal", ativo: true },

  // Periodontia
  { id: "proc-raspagem-supragengival", codigo: "PER-01", nome: "Raspagem supragengival", especialidade: "Periodontia", preco: 15000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-raspagem-subgengival", codigo: "PER-02", nome: "Raspagem subgengival, por sextante", especialidade: "Periodontia", preco: 14000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-gengivoplastia", codigo: "PER-03", nome: "Gengivoplastia", especialidade: "Periodontia", preco: 35000, duracaoMin: 60, exigeDente: true, exigeFace: false, ativo: true },
  { id: "proc-aumento-coroa-clinica", codigo: "PER-04", nome: "Aumento de coroa clínica", especialidade: "Periodontia", preco: 45000, duracaoMin: 60, exigeDente: true, exigeFace: false, ativo: true },

  // Cirurgia
  { id: "proc-exodontia-simples", codigo: "CIR-01", nome: "Exodontia simples", especialidade: "Cirurgia", preco: 15000, duracaoMin: 30, exigeDente: true, exigeFace: false, condicaoResultante: "ausente", ativo: true },
  { id: "proc-exodontia-incluso", codigo: "CIR-02", nome: "Exodontia de dente incluso", especialidade: "Cirurgia", preco: 40000, duracaoMin: 60, exigeDente: true, exigeFace: false, condicaoResultante: "ausente", ativo: true },
  { id: "proc-exodontia-deciduo", codigo: "CIR-03", nome: "Exodontia de dente decíduo", especialidade: "Cirurgia", preco: 8000, duracaoMin: 20, exigeDente: true, exigeFace: false, condicaoResultante: "ausente", ativo: true },
  { id: "proc-frenectomia", codigo: "CIR-04", nome: "Frenectomia", especialidade: "Cirurgia", preco: 35000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },

  // Prótese
  { id: "proc-coroa-ceramica", codigo: "PRO-01", nome: "Coroa total em cerâmica", especialidade: "Prótese", preco: 180000, duracaoMin: 60, exigeDente: true, exigeFace: false, condicaoResultante: "coroa", ativo: true },
  { id: "proc-coroa-metaloceramica", codigo: "PRO-02", nome: "Coroa metalocerâmica", especialidade: "Prótese", preco: 150000, duracaoMin: 60, exigeDente: true, exigeFace: false, condicaoResultante: "coroa", ativo: true },
  { id: "proc-nucleo-preenchimento", codigo: "PRO-03", nome: "Núcleo de preenchimento", especialidade: "Prótese", preco: 45000, duracaoMin: 45, exigeDente: true, exigeFace: false, ativo: true },
  { id: "proc-protese-total", codigo: "PRO-04", nome: "Prótese total, por arcada", especialidade: "Prótese", preco: 250000, duracaoMin: 90, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-protese-parcial-removivel", codigo: "PRO-05", nome: "Prótese parcial removível, por arcada", especialidade: "Prótese", preco: 200000, duracaoMin: 90, exigeDente: false, exigeFace: false, ativo: true },

  // Implantodontia
  { id: "proc-implante", codigo: "IMP-01", nome: "Implante osseointegrado", especialidade: "Implantodontia", preco: 350000, duracaoMin: 90, exigeDente: true, exigeFace: false, condicaoResultante: "implante", ativo: true },
  { id: "proc-enxerto-osseo", codigo: "IMP-02", nome: "Enxerto ósseo", especialidade: "Implantodontia", preco: 250000, duracaoMin: 90, exigeDente: true, exigeFace: false, ativo: true },
  { id: "proc-coroa-sobre-implante", codigo: "IMP-03", nome: "Coroa sobre implante", especialidade: "Implantodontia", preco: 200000, duracaoMin: 60, exigeDente: true, exigeFace: false, ativo: true },

  // Ortodontia
  { id: "proc-documentacao-ortodontica", codigo: "ORT-01", nome: "Documentação ortodôntica", especialidade: "Ortodontia", preco: 30000, duracaoMin: 40, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-aparelho-fixo", codigo: "ORT-02", nome: "Instalação de aparelho fixo", especialidade: "Ortodontia", preco: 150000, duracaoMin: 90, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-manutencao-aparelho", codigo: "ORT-03", nome: "Manutenção mensal do aparelho", especialidade: "Ortodontia", preco: 18000, duracaoMin: 30, exigeDente: false, exigeFace: false, ativo: true },
  { id: "proc-contencao-ortodontica", codigo: "ORT-04", nome: "Contenção ortodôntica, por arcada", especialidade: "Ortodontia", preco: 40000, duracaoMin: 30, exigeDente: false, exigeFace: false, ativo: true },
];
