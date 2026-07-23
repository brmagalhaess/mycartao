import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="border-b border-line/80 bg-paper/70 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/app"
              className="font-display text-xl font-semibold tracking-tight text-ink"
            >
              MyCartao
            </Link>
            <AppNav />
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
