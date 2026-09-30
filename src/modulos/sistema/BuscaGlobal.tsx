import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { pacientes } from "@/dados/colecoes";
import { useColecao } from "@/dados/useColecao";
import type { Paciente } from "@/dominio";
import { filtrarPacientes } from "@/modulos/pacientes/busca";
import { Avatar, Modal, TextField } from "@/ui";

import { EVENTO_BUSCAR } from "./atalhoDeBusca";

/** Quantos pacientes a lista mostra: acima disso, quem busca refina o termo em vez de rolar. */
const LIMITE = 8;

/**
 * As instâncias montadas, na ordem. Só a primeira responde ao atalho e ao evento: com a busca montada em dois lugares
 * (a casca e uma tela), cada Ctrl+K abriria duas caixas — ou abriria e fecharia a mesma.
 */
const montadas: symbol[] = [];

/**
 * A busca global de pacientes: `Ctrl+K` (`⌘K` no Mac) abre uma caixa onde quer que esteja montada; digita-se o nome (sem
 * acento nem caixa) ou o telefone e Enter abre a ficha. Monte-a DENTRO do roteador (usa `useNavigate`); fechada, não
 * renderiza nada.
 */
export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);
  const abertaRef = useRef(aberta);
  abertaRef.current = aberta;

  useEffect(() => {
    const eu = Symbol("busca");
    montadas.push(eu);
    const sou = () => montadas[0] === eu;

    function aoTeclar(e: globalThis.KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || (e.key !== "k" && e.key !== "K") || !sou()) return;
      // Não abre por cima de outro diálogo: o Escape do `Modal` fecha todos os abertos de uma vez.
      if (!abertaRef.current && document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setAberta((a) => !a);
    }
    function aoPedir() {
      if (sou()) setAberta(true);
    }

    document.addEventListener("keydown", aoTeclar);
    window.addEventListener(EVENTO_BUSCAR, aoPedir);
    return () => {
      montadas.splice(montadas.indexOf(eu), 1);
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener(EVENTO_BUSCAR, aoPedir);
    };
  }, []);

  return aberta ? <CaixaDeBusca aoFechar={() => setAberta(false)} /> : null;
}

function textoDoEstado(termo: string, achados: number): string {
  if (!termo.trim()) return "Digite o nome ou o telefone do paciente.";
  if (achados === 0) return "Nenhum paciente encontrado.";
  if (achados > LIMITE) return `Mostrando ${LIMITE} de ${achados}. Continue digitando para refinar.`;
  return achados === 1 ? "1 paciente encontrado." : `${achados} pacientes encontrados.`;
}

/** A caixa em si. Só existe montada enquanto aberta: cada abertura começa do zero, sem termo nem seleção. */
function CaixaDeBusca({ aoFechar }: { aoFechar: () => void }) {
  const navegar = useNavigate();
  const todos = useColecao(pacientes);
  const [termo, setTermo] = useState("");
  const [ativo, setAtivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const listaId = useId();

  const achados = useMemo(() => (termo.trim() ? filtrarPacientes(todos, termo) : []), [todos, termo]);
  const visiveis = achados.slice(0, LIMITE);

  // O `Modal` dá o foco ao botão Fechar num efeito dele, e o efeito de um filho roda ANTES do do pai: um `autoFocus`
  // no campo perderia. Este efeito é de quem monta o `Modal`, então roda depois e o foco fica no campo.
  useEffect(() => {
    campo.current?.focus();
  }, []);

  function abrir(p: Paciente) {
    aoFechar();
    navegar(`/pacientes/${p.id}`);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setAtivo((i) => Math.max(0, Math.min(visiveis.length - 1, i + passo)));
    } else if (e.key === "Enter" && visiveis[ativo]) {
      e.preventDefault();
      abrir(visiveis[ativo]);
    }
  }

  return (
    <Modal aberto titulo="Buscar paciente" onFechar={aoFechar}>
      <TextField
        ref={campo}
        label="Nome ou telefone do paciente"
        icon="ri-search-line"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAtivo(0);
        }}
        onKeyDown={aoTeclar}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visiveis.length > 0}
        aria-controls={visiveis.length > 0 ? listaId : undefined}
        aria-activedescendant={visiveis.length > 0 ? `${listaId}-${ativo}` : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      <p role="status" className="mt-3 text-sm text-foreground-500">
        {textoDoEstado(termo, achados.length)}
      </p>
      {visiveis.length > 0 && (
        <ul id={listaId} role="listbox" aria-label="Pacientes encontrados" className="mt-2 grid gap-1">
          {visiveis.map((p, i) => (
            <li
              key={p.id}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativo}
              onMouseMove={() => setAtivo(i)}
              onClick={() => abrir(p)}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 ${i === ativo ? "bg-primary-900/[0.07]" : ""}`}
            >
              <Avatar nome={p.nome} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground-950">{p.nome}</span>
                <span className="block text-sm text-foreground-500">{p.telefone}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
