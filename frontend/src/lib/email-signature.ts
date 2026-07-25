/** Build a simple HTML email signature from public profile data. */

export type EmailSignatureInput = {
  displayName: string;
  headline?: string;
  cardUrl: string;
  avatarUrl?: string | null;
  accent?: string | null;
};

export function buildEmailSignatureHtml(input: EmailSignatureInput): string {
  const name = escapeHtml(input.displayName.trim() || "Meu nome");
  const headline = escapeHtml(input.headline?.trim() || "");
  const url = escapeAttr(input.cardUrl);
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent || "")
    ? input.accent!
    : "#0f766e";
  const avatar = input.avatarUrl ? escapeAttr(input.avatarUrl) : "";

  const avatarCell = avatar
    ? `<td style="padding-right:14px;vertical-align:top;">
        <img src="${avatar}" width="64" height="64" alt="" style="border-radius:50%;display:block;object-fit:cover;" />
      </td>`
    : "";

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:#0c2a2e;">
  <tr>
    ${avatarCell}
    <td style="vertical-align:top;">
      <div style="font-size:16px;font-weight:700;color:#0c2a2e;">${name}</div>
      ${headline ? `<div style="color:#5b6b6e;margin-top:2px;">${headline}</div>` : ""}
      <div style="margin-top:8px;">
        <a href="${url}" style="color:${accent};text-decoration:none;font-weight:600;">Meu cartão digital →</a>
      </div>
    </td>
  </tr>
</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
