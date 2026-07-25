import { cookies, headers } from "next/headers";

import {
  LOCALE_COOKIE,
  isLocale,
  matchAcceptLanguage,
  type Locale,
} from "./config";

/** Server-side locale: explicit cookie choice wins, else browser language. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return matchAcceptLanguage(headerStore.get("accept-language"));
}
