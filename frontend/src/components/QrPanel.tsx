"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Props = {
  cardId: string;
};

type PrintTemplate = "classic" | "compact" | "bold";

const TEMPLATES: { id: PrintTemplate; label: string; pro?: boolean }[] = [
  { id: "classic", label: "Clássico (A4)" },
  { id: "compact", label: "Compacto (cartão)", pro: true },
  { id: "bold", label: "Bold (capa)", pro: true },
];

async function blobFromApi(path: string): Promise<Blob> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw new Error(`download_failed:${res.status}`);
  }
  return res.blob();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QrPanel({ cardId }: Props) {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [template, setTemplate] = useState<PrintTemplate>("classic");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      const who = await apiFetch("/api/v1/auth/whoami");
      if (who.status === 401) {
        router.replace("/login");
        return;
      }
      if (who.ok) {
        const user = (await who.json()) as { plan: string };
        if (!cancelled) {
          setIsPro(user.plan === "pro" || user.plan === "admin");
        }
      }

      const blob = await blobFromApi(
        `/api/v1/cards/${cardId}/qr?format=png`,
      );
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setQrUrl(objectUrl);
    }

    load().catch(() => {
      if (!cancelled) setError("Não foi possível carregar o QR.");
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cardId, router]);

  async function download(kind: "png" | "svg" | "pdf") {
    setBusy(kind);
    setError("");
    try {
      if (kind === "png") {
        const blob = await blobFromApi(
          `/api/v1/cards/${cardId}/qr?format=png`,
        );
        triggerDownload(blob, `mycartao-${cardId}-qr.png`);
      } else if (kind === "svg") {
        const blob = await blobFromApi(
          `/api/v1/cards/${cardId}/qr?format=svg`,
        );
        triggerDownload(blob, `mycartao-${cardId}-qr.svg`);
      } else {
        const blob = await blobFromApi(
          `/api/v1/cards/${cardId}/print.pdf?template=${template}`,
        );
        triggerDownload(blob, `mycartao-${cardId}-${template}.pdf`);
      }
    } catch {
      setError(
        "Falha no download. Free só gera o template clássico com watermark; Pro desbloqueia Compacto e Bold.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink-soft">
        <Link
          href={`/app/cards/${cardId}`}
          className="transition hover:text-teal"
        >
          ← Voltar ao editor
        </Link>
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        QR e Print Kit
      </h1>
      <p className="mt-2 max-w-lg text-ink-soft">
        Baixe o QR ou o PDF para gráfica. Free inclui watermark; Pro remove e
        libera templates extras.
      </p>

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="flex h-56 w-56 items-center justify-center border border-line bg-paper">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrUrl}
              alt="QR Code do cartão"
              className="h-48 w-48 object-contain"
            />
          ) : (
            <p className="text-sm text-ink-soft">
              {error ? "—" : "Carregando QR…"}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download("png")}
            className="rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
          >
            {busy === "png" ? "Baixando…" : "Baixar PNG"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download("svg")}
            className="rounded-md border border-line bg-paper/70 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-60"
          >
            {busy === "svg" ? "Baixando…" : "Baixar SVG"}
          </button>

          <div className="mt-2 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              Template do PDF
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => {
                const locked = Boolean(t.pro && !isPro);
                const active = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={locked}
                    onClick={() => setTemplate(t.id)}
                    className={
                      active
                        ? "rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-paper"
                        : locked
                          ? "rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft/50"
                          : "rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-teal/40"
                    }
                    title={locked ? "Disponível no Pro" : undefined}
                  >
                    {t.label}
                    {t.pro ? " · Pro" : ""}
                  </button>
                );
              })}
            </div>
            {!isPro ? (
              <Link
                href="/app/billing"
                className="mt-2 inline-block text-xs font-medium text-teal hover:text-teal-deep"
              >
                Assinar Pro para Compacto/Bold sem watermark →
              </Link>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">
                Pro: PDF sem watermark MyCartao.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download("pdf")}
            className="rounded-md border border-line bg-paper/70 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-60"
          >
            {busy === "pdf" ? "Baixando…" : "Baixar print.pdf"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
