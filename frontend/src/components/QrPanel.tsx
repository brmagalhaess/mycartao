"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Props = {
  cardId: string;
};

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

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      const meRes = await apiFetch("/api/v1/me");
      if (meRes.status === 401) {
        router.replace("/login");
        return;
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
          `/api/v1/cards/${cardId}/print.pdf`,
        );
        triggerDownload(blob, `mycartao-${cardId}-print.pdf`);
      }
    } catch {
      setError("Falha no download. Faça login novamente se a sessão expirou.");
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
        QR e impressão
      </h1>
      <p className="mt-2 max-w-lg text-ink-soft">
        Baixe o QR em PNG ou SVG, ou o PDF pronto para gráfica.
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
