import { useRef, useState, type ChangeEvent } from "react";

import { exportarBackup, lerBackup, substituirPor, type Backup } from "@/dados/backup";
import { Button, diaISO, GlassCard, Modal, toast } from "@/ui";

function baixar(nome: string, texto: string): void {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

/** `30/09/2026 às 14:32`, no fuso do navegador. */
function quando(instanteISO: string): string {
  const d = new Date(instanteISO);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * O cartão do backup: **Exportar** baixa um arquivo com tudo o que o navegador guarda; **Importar** lê um arquivo,
 * valida antes de tocar em qualquer coisa e, só depois da confirmação, troca os dados e recarrega a página (as
 * coleções guardam o estado em memória — ver `src/dados/backup.ts`).
 */
export default function CartaoDeBackup() {
  const entrada = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string>();
  const [pendente, setPendente] = useState<Backup>();

  function exportar() {
    const backup = exportarBackup();
    if (Object.keys(backup.dados).length === 0) {
      setErro("Não há dados para exportar neste navegador.");
      return;
    }
    setErro(undefined);
    baixar(`arcada-backup-${diaISO(new Date(backup.exportadoEm))}.json`, JSON.stringify(backup, null, 2));
    toast("Backup exportado");
  }

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // sem isto, escolher o MESMO arquivo de novo não dispara `change`
    if (!arquivo) return;
    const texto = await arquivo.text().catch(() => null);
    const leitura = texto === null ? { erro: "Não foi possível ler o arquivo." } : lerBackup(texto);
    if ("erro" in leitura) {
      setPendente(undefined);
      setErro(leitura.erro);
      return;
    }
    setErro(undefined);
    setPendente(leitura.backup);
  }

  function confirmar(backup: Backup) {
    const falha = substituirPor(backup);
    if (falha) {
      setPendente(undefined);
      setErro(falha);
      return;
    }
    location.reload();
  }

  return (
    <GlassCard className="p-[26px]">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground-950">Backup dos dados</h2>
      <p className="mt-1 text-foreground-500">
        Uma cópia de tudo o que está salvo neste navegador: pacientes, agenda, financeiro e prontuário.
      </p>

      <p role="note" className="mt-4 rounded-2xl border border-foreground-950/[0.10] px-4 py-3 text-sm text-foreground-700">
        <i className="ri-shield-keyhole-line mr-1.5" aria-hidden="true" />
        O arquivo contém <strong>dado de saúde</strong> de pacientes. Guarde em lugar seguro e não o envie por canais
        abertos.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={exportar}>
          <i className="ri-download-2-line text-base" aria-hidden="true" />
          Exportar backup
        </Button>
        <Button variant="secondary" onClick={() => entrada.current?.click()}>
          <i className="ri-upload-2-line text-base" aria-hidden="true" />
          Importar backup
        </Button>
        <input ref={entrada} type="file" accept="application/json,.json" hidden aria-label="Arquivo de backup" onChange={escolher} />
      </div>

      {erro && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-400 px-4 py-3 text-sm text-red-600">
          {erro}
        </p>
      )}

      {pendente && (
        <Modal
          aberto
          titulo="Substituir os dados atuais?"
          onFechar={() => setPendente(undefined)}
          rodape={
            <>
              <Button variant="ghost" onClick={() => setPendente(undefined)}>
                Cancelar
              </Button>
              <Button onClick={() => confirmar(pendente)}>Substituir os dados</Button>
            </>
          }
        >
          <p className="text-foreground-700">
            O backup foi feito em <strong>{quando(pendente.exportadoEm)}</strong>. Ao importar, tudo o que está salvo neste
            navegador é apagado e trocado pelo conteúdo do arquivo, e a página é recarregada.
          </p>
          <p className="mt-3 text-foreground-700">
            Isso não pode ser desfeito. Para guardar o que existe hoje, exporte um backup antes.
          </p>
        </Modal>
      )}
    </GlassCard>
  );
}
