import React from "react";

/**
 * Auto-detects URLs, emails, and phone numbers in plain text and
 * renders them as clickable links. Preserves whitespace/newlines.
 */
const URL_RE =
  /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s().-]{7,}\d)/gi;

export function Linkify({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  let key = 0;

  while ((match = URL_RE.exec(text)) !== null) {
    const [full, url, email, phone] = match;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (url) {
      const href = url.startsWith("http") ? url : `https://${url}`;
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
        >
          {url}
        </a>
      );
    } else if (email) {
      parts.push(
        <a
          key={key++}
          href={`mailto:${email}`}
          className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
        >
          {email}
        </a>
      );
    } else if (phone) {
      const tel = phone.replace(/[^\d+]/g, "");
      parts.push(
        <a
          key={key++}
          href={`tel:${tel}`}
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {phone}
        </a>
      );
    } else {
      parts.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {parts}
    </span>
  );
}
