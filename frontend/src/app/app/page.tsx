import Link from "next/link";

/** Placeholder — dashboard completo na Task 13. */
export default function AppDashboardPage() {
  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern flex min-h-screen flex-col px-6 py-8">
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">MyCartao</h1>
          <Link href="/" className="text-sm font-medium text-ink-soft">
            Início
          </Link>
        </header>
        <main className="mx-auto mt-16 w-full max-w-3xl">
          <h2 className="font-display text-3xl font-semibold">Dashboard</h2>
          <p className="mt-3 text-ink-soft">
            Área autenticada — o dashboard completo chega na próxima task.
          </p>
        </main>
      </div>
    </div>
  );
}
