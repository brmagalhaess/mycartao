"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function GoRedirectPage() {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId;
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      const res = await apiFetch(`/api/v1/public/go/${slugOrId}`);
      if (!res.ok) {
        if (!cancelled) setError("Link não encontrado.");
        return;
      }
      const data = (await res.json()) as { target: string; url: string };
      if (!cancelled && data.url) {
        window.location.replace(data.url);
      }
    }

    redirect().catch(() => {
      if (!cancelled) setError("Falha ao redirecionar.");
    });

    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  return (
    <div className="atmosphere flex min-h-screen items-center justify-center px-6 text-ink">
      <div className="text-center">
        <p className="font-display text-2xl font-semibold">MyCartao</p>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">Redirecionando…</p>
        )}
      </div>
    </div>
  );
}
