import { Link } from "react-router-dom";

import type { Paciente } from "@/dominio";

import { linkDeRetorno } from "./mensagem";

// Os dois links têm a cara do botão `ghost` do kit, como o do WhatsApp no detalhe da consulta.
const BOTAO_LINK =
  "press inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-semibold whitespace-nowrap text-primary-800 transition-colors duration-200 hover:bg-primary-900/[0.07]";

/**
 * O contato do retorno de um paciente: o link que abre o WhatsApp dele com a mensagem pronta — só quando o telefone
 * serve — e o atalho para marcar a consulta na agenda. A agenda não recebe o paciente: quem marca o escolhe lá.
 * Quem usa leitor de tela ouve de quem é cada link, porque a lista repete os mesmos dois.
 */
export default function ContatoDoRetorno({ paciente }: { paciente: Paciente }) {
  const whatsapp = linkDeRetorno(paciente);
  return (
    <>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={BOTAO_LINK}>
          <i className="ri-whatsapp-line text-base" aria-hidden="true" />
          WhatsApp{" "}
          <span className="sr-only">de {paciente.nome}, abre em outra aba</span>
        </a>
      )}
      <Link to="/agenda" className={BOTAO_LINK}>
        <i className="ri-calendar-line text-base" aria-hidden="true" />
        Marcar consulta{" "}
        <span className="sr-only">para {paciente.nome}</span>
      </Link>
    </>
  );
}
