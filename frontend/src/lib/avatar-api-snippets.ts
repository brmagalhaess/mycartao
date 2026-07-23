export type AvatarLangId =
  | "html"
  | "javascript"
  | "nextjs"
  | "python"
  | "php"
  | "curl";

export const AVATAR_LANGS: { id: AvatarLangId; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "javascript", label: "JavaScript" },
  { id: "nextjs", label: "Next.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "curl", label: "cURL" },
];

export function buildAvatarSnippets(
  origin: string,
  email = "voce@email.com",
): Record<AvatarLangId, string> {
  const base = origin || "https://SEU_DOMINIO";
  const encodedHint = "${encodeURIComponent(email)}";
  return {
    html: `<img
  src="${base}/api/v1/public/avatar?email=${email}&s=200"
  alt=""
  width="200"
  height="200"
/>`,
    javascript: `const origin = "${base}";
const email = "${email}";
const url = \`\${origin}/api/v1/public/avatar?email=${encodedHint}&s=200\`;

const img = document.createElement("img");
img.src = url;
img.alt = "";
img.width = 200;
img.height = 200;
document.body.appendChild(img);`,
    nextjs: `// app/components/MyCartaoAvatar.tsx
export function MyCartaoAvatar({ email }: { email: string }) {
  const src = \`${base}/api/v1/public/avatar?email=${encodedHint}&s=128\`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={128} height={128} className="rounded-full" />
  );
}`,
    python: `import requests

base = "${base}"
email = "${email}"
resp = requests.get(
    f"{base}/api/v1/public/avatar",
    params={"email": email, "s": 200},
)
resp.raise_for_status()
with open("avatar.bin", "wb") as f:
    f.write(resp.content)`,
    php: `<?php
$base = '${base}';
$email = '${email}';
$url = $base.'/api/v1/public/avatar?email='.urlencode($email).'&s=200';
$bytes = file_get_contents($url);
file_put_contents('avatar.bin', $bytes);`,
    curl: `BASE="${base}"
curl -L "$BASE/api/v1/public/avatar?email=${email}&s=200" -o avatar.bin`,
  };
}
