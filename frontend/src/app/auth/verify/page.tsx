"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token ausente. Solicite um novo link de acesso.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch(
          `/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            detail?: string;
          } | null;
          if (!cancelled) {
            setError(
              data?.detail ?? "Link inválido ou expirado. Peça um novo e-mail.",
            );
          }
          return;
        }
        if (!cancelled) {
          router.replace("/app");
        }
      } catch {
        if (!cancelled) {
          setError("Falha de rede ao verificar o link.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern flex min-h-screen flex-col items-center justify-center px-6">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight"
        >
          MyCartao
        </Link>
        {error ? (
          <div className="mt-8 max-w-md text-center">
            <p className="text-ink-soft">{error}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper hover:bg-teal-deep"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <p className="mt-8 text-ink-soft">Validando seu acesso…</p>
        )}
      </div>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="atmosphere flex min-h-screen items-center justify-center text-ink-soft">
          Carregando…
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
