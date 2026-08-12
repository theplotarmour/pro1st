/**
 * Splits a Shopify description into an opening passage and collapsible
 * sections, one per heading the merchant wrote.
 *
 * Shopify's rich-text editor has no concept of sections — a description is
 * one flat run of `<p>`, `<h2>`, `<ul>` and so on. But merchants structure it
 * anyway, by writing headings: "Technical Specifications", "In the Box",
 * "Warranty". Those headings are the structure, and this reads it back out.
 *
 * Nothing here is keyed to a particular heading text. Rename a heading in the
 * admin, or add a fourth one, and the page follows — the alternative was a
 * hardcoded list of section titles that silently stops matching the moment
 * someone edits the copy.
 *
 * The split is done with a regex rather than a DOM parser because this runs
 * on the server during render, where there is no DOM, and pulling in a full
 * HTML parser to find `<h2>` in Shopify's own well-formed editor output is
 * not a trade worth making. Malformed input degrades to "it is all intro",
 * which is exactly what the page did before this existed.
 */

export interface DescriptionSection {
  /** Heading text, tags stripped. */
  title: string;
  /** The HTML that followed it, up to the next heading. */
  html: string;
}

export interface ParsedDescription {
  /** Everything before the first heading. Always shown. */
  intro: string;
  sections: DescriptionSection[];
}

const HEADING = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

/** True when the fragment carries something other than empty markup. */
function hasContent(html: string): boolean {
  return stripTags(html).length > 0 || /<(img|table|iframe)\b/i.test(html);
}

export function parseDescription(html: string | undefined): ParsedDescription {
  if (!html) return { intro: "", sections: [] };

  const matches = [...html.matchAll(HEADING)];
  if (matches.length === 0) return { intro: html, sections: [] };

  const first = matches[0]!;
  const intro = html.slice(0, first.index).trim();

  const sections: DescriptionSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const start = match.index + match[0].length;
    const next = matches[i + 1];
    const end = next ? next.index : html.length;

    const title = stripTags(match[2] ?? "");
    const body = html.slice(start, end).trim();

    // A heading with nothing under it is a typo, not a section.
    if (!title || !hasContent(body)) continue;

    sections.push({ title, html: body });
  }

  // One section and no intro is not worth a disclosure — it would hide the
  // entire description behind a click.
  if (sections.length === 1 && !hasContent(intro)) {
    return { intro: html, sections: [] };
  }

  return { intro, sections };
}
