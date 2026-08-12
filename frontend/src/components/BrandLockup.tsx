import Link from "next/link";

type Props = {
  href: string;
  size?: "sm" | "md";
  className?: string;
};

const SIZES = { sm: 28, md: 32 } as const;

export default function BrandLockup({
  href,
  size = "md",
  className = "",
}: Props) {
  const px = SIZES[size];
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 font-display font-semibold tracking-tight text-ink transition hover:text-teal-deep ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mark.svg"
        alt=""
        width={px}
        height={px}
        className="shrink-0"
      />
      <span className={size === "sm" ? "text-lg" : "text-xl"}>MyCartao</span>
    </Link>
  );
}
