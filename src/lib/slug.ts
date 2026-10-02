import { slugify } from "./utils";

/** Model için benzersiz slug üretir */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, currentSlug?: string) {
  const root = slugify(base) || "kayit";
  let s = root;
  let i = 2;
  while (s !== currentSlug && (await exists(s))) s = `${root}-${i++}`;
  return s;
}
