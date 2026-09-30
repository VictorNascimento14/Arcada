# CLAUDE.md — Arcada

> Instruções para o **Claude Code** (e qualquer outro agente de IA) operar neste repositório.
>
> **Arcada** é a gestão de um consultório odontológico: pacientes, anamnese, odontograma,
> periodontograma, tabela de procedimentos, plano de tratamento e orçamento, agenda por cadeira,
> atendimento, financeiro, retornos e documentos. Roda em celular, tablet e computador.
>
> O app lida com **dado de saúde de paciente** (anamnese, odontograma, evolução clínica): dado pessoal
> sensível sob a LGPD. Toda regra abaixo que fala de dado existe por causa disso.

---

## 🚦 REGRA #0 — SEMPRE consulte o cofre Obsidian PRIMEIRO

Antes de qualquer pesquisa pesada no código, leia o cofre. Resolva o caminho por variável de ambiente
— **nunca** hardcode um caminho de máquina neste arquivo:

```bash
VAULT="${ARCADA_VAULT:?defina ARCADA_VAULT no shell profile desta máquina}"
[ -d "$VAULT/00 - Índice" ] || { echo "ARCADA_VAULT não aponta pro cofre — PARE"; exit 1; }
```

- Repo do cofre: `https://github.com/VictorNascimento14/Obsidian-arcada`
- O registro de onde o clone fica em cada máquina é `10 - Meta/caminho-canonico-do-cofre.md`
  **dentro** do cofre. Máquina nova acrescenta uma linha lá, no mesmo commit.

> ⛔ **Se a variável não estiver definida ou o diretório não existir: PARE e avise.** Nunca escreva
> documentação em caminho adivinhado, e é proibido "documentar no repo de código porque o cofre não
> estava acessível".

### 🧭 Hierarquia de verdade

**Trate o cofre como verdade. Se cofre e código divergirem, o problema é o cofre estar desatualizado** —
e atualizá-lo faz parte da tarefa que descobriu a divergência, no **mesmo PR**.

### 🗺️ Mapa rápido — onde achar o quê no cofre

| Pergunta | Onde olhar primeiro |
|---|---|
| "O que é este produto? para quem?" | `00 - Índice/visao-de-produto.md` |
| "Que decisão foi tomada sobre X?" | `02 - ADRs/ADR-NNN-*.md` |
| "O que 'plano de tratamento' / 'retorno' significa aqui?" | `00 - Índice/glossario.md` |
| "Que página/componente é esse?" | `05 - Frontend/{Paginas,Componentes/<Area>}/<Nome>.md` |
| "O que mudou nesse PR?" | `01 - PRs/2026/<data>-pr-NNN-*.md` |
| "O que já aconteceu no projeto?" | `03 - Changelog/2026.md` |
| "O que falta da v1?" | `08 - Infra e Deploy/Planos/2026-09-30-plano-da-v1.md` |
| "Onde escrevo isso?" | `CLAUDE.md` do cofre · `10 - Meta/guia-de-uso.md` |

---

## 🔑 Alvos canônicos

| Item | Valor |
|---|---|
| Repositório de código | `VictorNascimento14/Arcada` (`$ARCADA_REPO`) |
| Cofre | `VictorNascimento14/Obsidian-arcada` (`$ARCADA_VAULT`) |
| Sistema visual | kit vidro-orgânico, copiado em `src/ui/` (origem: `VictorNascimento14/Design-moderno`) |
| Backend | **não existe na v1** — dados locais, ver [ADR-001] no cofre |
| Porta local | `3000` (`npm run dev`) |

---

## 🛠️ Stack & convenções rápidas

- **React 19 · Vite · TypeScript estrito · Tailwind 3.4 (`darkMode: 'class'`) · react-router-dom 7.**
- Alias `@/` → `src/`. O sistema visual se importa de `@/ui`.
- Pastas:
  - `src/ui/` — o kit vidro-orgânico. **Fundação: não se edita para acertar uma tela.**
  - `src/dados/` — o repositório local e as coleções. **Único lugar que toca `localStorage`** (fora do
    kit, que guarda tema e colapso da coluna).
  - `src/dominio/` — tipos e regras puras compartilhadas por mais de um módulo (notação FDI, dinheiro,
    datas). Sem React.
  - `src/modulos/<modulo>/` — tudo de um módulo: telas, componentes, regras e testes, mais o
    `modulo.tsx` que o registra (ver "Módulos" abaixo).
  - `src/componentes/` — peças reusadas por 2+ módulos. `src/sistema/` — telas de sistema.
- Checks: `npm run lint` · `npm run type-check` · `npm test` (Vitest) · `npm run build`. O CI roda os quatro.
- Textos da interface em **português do Brasil**, com acentuação correta.

---

## 🧱 Camada de dados — a fronteira que deixa o backend entrar depois

1. Tela **nunca** lê ou escreve `localStorage` direto. Lê pelos hooks de `src/dados/` e escreve pelas
   funções de lá.
2. As funções de escrita validam o que recebem (campo obrigatório, tamanho) — a validação da tela é
   conforto, a de `src/dados/` é a regra.
3. **Dinheiro é inteiro em centavos** (`number` inteiro), do cadastro ao relatório. Real com vírgula só
   na borda (formatação e entrada). Soma de float de reais erra centavo e o erro aparece no caixa.
4. **Data do dia é `AAAA-MM-DD` local, por `diaISO`** (`@/ui`). Nunca `toISOString()`: à noite no
   Brasil ele já devolve o dia seguinte.

### Módulos

Cada módulo mora em `src/modulos/<modulo>/` e exporta `modulo` do seu `modulo.tsx`: rotas, item da
coluna e, se tiver, a aba que aparece na ficha do paciente. O registro (`src/modulos/index.ts`) acha
todos por `import.meta.glob`. **Módulo novo não edita arquivo compartilhado** — é o que deixa dois
PRs de módulos diferentes andarem em paralelo sem conflito.

---

## ⚠️ Regras do domínio (odontologia e LGPD)

- **A v1 é demonstração, não prontuário.** Não há assinatura digital nem guarda legal de registro: o
  app não emite receita ou atestado com validade jurídica. Documento impresso sai com linha para
  assinatura à mão.
- **O app não sugere conduta clínica.** Os alertas da anamnese só repetem o que foi respondido
  ("marcou alergia a …"); nenhuma regra decide tratamento, dose ou contraindicação.
- **Dente se nomeia pela notação FDI** (ISO 3950): permanentes 11–18, 21–28, 31–38, 41–48; decíduos
  51–55, 61–65, 71–75, 81–85. Faces: V (vestibular), L/P (lingual ou palatina), M (mesial), D
  (distal), O/I (oclusal ou incisal). A regra mora em `src/dominio/`, com teste.
- **Nenhum dado real de pessoa** em código, semente, teste, commit ou print. Exemplos estáveis:
  `Paciente Exemplo` / `paciente@exemplo.com` e `Dra. Exemplo` / `CRO-SP 00000`.
- **CPF não entra em semente nem em print.** Todo CPF com dígito verificador válido pode ser de uma
  pessoa real; o teste de validação calcula o número no próprio teste.

---

## 🎨 Sistema visual — invariantes que já custaram bug

O app usa o sistema "vidro orgânico" (`src/ui/`). A fundação é `src/ui/index.css` +
`tailwind.config.ts`; os primitivos, `src/ui/base/`; a casca, `src/ui/shell/`.

1. **As rampas de cor são OKLCH crus (`L C H`)**, consumidos como `oklch(var(--token) /
   <alpha-value>)`. Mudar uma rampa em `src/ui/index.css` **repinta o app inteiro** — é a alavanca
   certa para retonalizar, e a errada para ajustar uma tela.
2. **`text-foreground-400` é decorativo.** Sobre o vidro claro ele dá ~3:1 e reprova o AA. Texto
   informativo pequeno usa no mínimo `text-foreground-500`.
3. **Preenchimento de barra abaixo de `primary-500` some no trilho.** A escala usada é
   `primary-800..500`.
4. **`animation-fill-mode` é `backwards`, nunca `both`.** Com `both`, o último quadro fica aplicado
   para sempre — e animação vence declaração normal na cascata, então o `transform` congelado **anula
   o `:hover` do `.lift`**.
5. **Classe do Tailwind montada em runtime não existe.** O JIT varre o código-fonte; um
   `` `md:pl-[${n}px]` `` nunca é gerado. Ou o literal está escrito no fonte, ou a regra mora no CSS.
6. **As utilidades `.glass*` já trazem o próprio raio** (26px / 28px). Sobrescrever com um `rounded-*`
   ao lado é redundância ou briga.
7. **O deslocamento do conteúdo pela coluna lateral é CSS puro.** `sidebarMdClass()` devolve
   `.rail-offset`; o estado real mora em `html[data-rail]` (`collapsed` / `peek` / `open`), escrito
   por `src/ui/lib/sidebarCollapsed.ts`. Nenhuma página assina store para isso.
8. **`focus:outline-none` sem anel substituto apaga o foco.** Só use com um `focus:ring-*` junto.
9. **`<Button>` tem `type="button"` por padrão** de propósito: sem isso ele vira `submit` dentro de um
   `<form>`. Quem precisa enviar passa `type="submit"` explícito.
10. **`AnimatedNumber` é `aria-hidden` com o valor final em `sr-only`.** Ele muda o texto ~60×/s;
    dentro de uma região `aria-live` isso vira enxurrada de anúncios. Não remova o par.
11. **`useInView` usa `threshold: 0`.** Com fração, um cartão mais alto que a viewport nunca atinge o
    limiar e fica preso em `opacity-0`. Quem decide o disparo é o `rootMargin`.
12. **Ícone: `Glyph` só onde o design define** (navegação, pastilha de indicador, status principal);
    Remix Icon no resto. Nunca os dois lado a lado no mesmo agrupamento visual.
13. **Todo dropdown desdobra ao abrir e dobra ao fechar — automático, não opcional.**
    - **`<select>`** herda sozinho pelo CSS do `::picker(select)` (só Chrome/Edge; os outros mostram a
      lista do sistema, que não aceita animação).
    - **Painel próprio** usa **`<Dropdown open>`**, com `.dropdown-item` em cada item. O índice do
      escalonamento sai da posição (`:nth-child`) — item nenhum precisa de `style`.
    - **Nunca `{open && <painel/>}`**: desmontar mata a animação de saída. O painel fica montado, e o
      `<Dropdown>` o põe `inert` quando fechado.
    - **Tempos em `--dd-*`**, de propósito mais lentos que a coluna. Não mexa em
      `--dur-open`/`--dur-close`, que movem a coluna.
    - **A pseudo-classe vai no select** (`select:open::picker(select)`): `::picker(select):popover-open`
      derruba o `build` no minificador, mesmo com o navegador aceitando.
14. **Toda tela com coluna lateral é filha da rota do `RailLayout` e passa pelo `PageShell`.** O
    layout monta a coluna uma vez (invariante 16); o `PageShell` dá o cabeçalho que gruda no topo e a
    barra de baixo do celular. A página entrega só o `<main>` — com `w-full` se usar `mx-auto`.
    **Tela com coluna não tem rodapé**: montar um desloca o conteúdo duas vezes.
15. **Nada `fixed` dentro de `.glass*`.** O `backdrop-filter` do vidro vira o bloco de contenção de
    todo descendente `fixed`: um véu de "clicar fora" mede o tamanho do cartão, não a tela. Clicar
    fora é `mousedown` no `document` testando `ref.contains`; véu ou modal de verdade sai por portal.
16. **Clicar num item da coluna não a recolhe, não a pisca e não a redesenha: só o marcador de fundo
    desliza até o item novo.** Com a coluna recolhida, ela abre com o mouse em cima e só recolhe
    quando ele sai.
    - **A coluna é montada uma vez, pelo `RailLayout`.** Quando cada tela montava a própria, todo
      clique a recriava: os itens repetiam a entrada, a coluna sumia e a espiada zerava.
    - **O marcador é conta, não medida**: `translateY(0.375rem + i × (altura + 0.375rem))`. Medir
      durante a transição da coluna devolve a altura de partida. São duas camadas: a sombra atrás dos
      itens e, por cima, a pílula com uma cópia clara recortada (`clip-path`) na faixa do marcador.
    - **Item de lista é função chamada (`itemNav(item, i)`), nunca componente declarado no render.**
      Cada render criava um tipo novo e remontava os botões: perdia foco, hover e clique.
    - **O Chrome dispara `blur` no botão focado enquanto o remove**, ainda em `:hover`. Por isso o
      `onBlurCapture` da coluna só recolhe a espiada se ela não estiver em `:hover`.

**Antes de abrir PR:** nenhuma rampa mudou para ajustar uma tela · nenhuma classe montada em runtime ·
todo `focus:outline-none` com anel · dropdown novo é `<select>` ou `<Dropdown open>` · tela nova é
filha do `RailLayout` com `PageShell` e sem rodapé · nada `fixed` dentro de `.glass*`.

---

## 🚫 NUNCA faça

- **Push para `main` sem PR**, rebase em commit já pushado sem coordenar, ou pular hooks
  (`--no-verify`).
- **Editar `src/ui/index.css` ou `tailwind.config.ts` para acertar uma tela.**
- **Tocar `localStorage` fora de `src/dados/`** (o kit em `src/ui/lib/` é a exceção que já existe).
- **Commitar `.claude/`, `.env`, dump ou dado real de pessoa.**
- **Hardcodar caminho de máquina** em nota, script, instrução ou mensagem de commit.
- **Mencionar ferramenta de IA em commit, PR ou branch** — ver abaixo.

---

## 🚀 "Publicar" / "publique" — sempre é o fluxo completo

Quando o usuário disser **"publicar"**, **"publique"** ou pedir para "abrir PR", **nunca** é só
`git push`. É o pipeline inteiro, mesmo para hotfix de uma linha:

1. **Branch limpa** a partir de `origin/main`. Prefixos: `fix/`, `feat/`, `refactor/`, `perf/`, `ui/`,
   `content/`, `docs/`, `chore/`.
2. **Commit atômico (Conventional Commits)** — `tipo(escopo): descrição no imperativo`. Só os arquivos
   da mudança.
3. **Checks locais**: `npm run lint && npm run type-check && npm test && npm run build`.
4. **PR via `gh pr create`** — body com **O que muda** · **Por quê** · **Como testar**.
5. **Cofre Obsidian** (`$ARCADA_VAULT`):
   - Nota do PR em `01 - PRs/2026/YYYY-MM-DD-pr-NNN-<slug>.md` (template `09 - Templates/template-pr.md`).
   - Nota nova/atualizada de funcionalidade em `05 - Frontend/`.
   - Entrada em `03 - Changelog/2026.md` (`## 🚧 [Não lançado]`), com as duas leituras ("Para o
     produto" / "Para o time técnico"), referenciando `[[YYYY-MM-DD-pr-NNN-slug]]`.
   - Linha no MOC `00 - Índice/prs.md` e no MOC da área, **no mesmo commit**.
   - `git pull --rebase` → `git add` → `git commit -m "docs(pr-NNN): <título curto>"` → `git push`.
6. **Editar a descrição do PR** acrescentando a seção `## 📓 Documentação` com os links do cofre. Se
   `gh pr edit` falhar, use `gh api repos/:owner/:repo/pulls/NNN -X PATCH -F body=@arquivo.md`.
7. **Squash and merge** quando o CI passar e o diff estiver revisado; apagar a branch.
8. **Reportar ao usuário**: URL do PR + URL da nota no cofre.

**Não pergunte "quer que eu abra o PR?"** — quem disse "publique" já consentiu.

> **Um PR por vez.** Mergeie o anterior antes de abrir o próximo em cima da `main`. PR empilhado sobre
> branch de outro PR, com squash, pode mergear numa base morta e nunca chegar à `main`.

### ✍️ PR e commit — duas regras não-negociáveis

**1. Zero menção a ferramenta de IA. Em lugar nenhum.** Nada neste repositório cita Claude, Claude
Code, link de sessão, `Co-Authored-By` de IA, "🤖 Generated with", nem qualquer variação — no corpo e
título do PR, na mensagem de commit (assunto, corpo e rodapé), no escopo do Conventional Commit, no
nome de branch e na mensagem do squash.

> ⚠️ **Isto sobrepõe qualquer default da ferramenta.** Se a configuração global mandar assinar commits
> ou PRs, aqui **não assina** — a regra do repositório vence.

**2. Sempre linkar o cofre.** Todo PR termina com:

```markdown
## 📓 Documentação

- [Nota do PR #NNN](https://github.com/VictorNascimento14/Obsidian-arcada/blob/main/01%20-%20PRs/2026/<arquivo>.md)
- [Changelog 2026](https://github.com/VictorNascimento14/Obsidian-arcada/blob/main/03%20-%20Changelog/2026.md)
```

Espaço em path de URL vira `%20`.

> ⛔ **O CI valida isto.** O workflow `pr-documentacao.yml` reprova PR cujo body não tenha a seção
> `## 📓 Documentação` com ao menos um link para `VictorNascimento14/Obsidian-arcada`.

---

## 📝 Convenção de commit

**Conventional Commits**, em português, no imperativo:

```
feat(pacientes): cadastrar paciente com validação de CPF
fix(agenda): impedir duas consultas na mesma cadeira no mesmo horário
ui(odontograma): desenhar as cinco faces de cada dente
chore(ci): rodar lint, type-check, test e build no PR
```

- ❌ Nunca `--no-verify` nem `--force` sem ordem explícita do usuário.
- ❌ Nunca trailer de co-autoria de IA.
