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
        <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <Link
              href="/app"
              className="font-display text-xl font-semibold tracking-tight text-ink transition hover:text-teal-deep"
            >
              MyCartao
            </Link>
            <AppNav />
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
