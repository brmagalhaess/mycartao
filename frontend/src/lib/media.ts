/**
 * Normalize media URLs to same-origin `/api/v1/media/files/...`.
 * Old records may still store absolute MinIO hosts (localhost:9000 / minio:9000).
 */
export function toMediaSrc(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/api/v1/media/files/")) {
    return trimmed;
  }

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const bucketMatch = trimmed.match(/\/mycartao\/(.+)$/);
  if (bucketMatch?.[1]) {
    return `/api/v1/media/files/${bucketMatch[1]}`;
  }

  try {
    const parsed = new URL(
      trimmed,
      typeof window !== "undefined" ? window.location.origin : "http://local",
    );
    if (parsed.pathname.startsWith("/api/v1/media/files/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // keep original below
  }

  return trimmed;
}
