/**
 * Generates a simple placeholder card image (a colored gradient with the
 * card's initials) as a data: URI SVG — used anywhere a card needs an
 * `image_normal`/`image_small` but there's no real card art available
 * (no card database wired up yet). Extracted out of mockGameApi.ts so
 * the deck builder's decklist-import feature can build real Card
 * objects with consistent-looking art, not a third separate style.
 */

export type ArtFrameKey = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

const FRAME_COLORS: Record<ArtFrameKey, [string, string]> = {
  W: ['#f3eedd', '#8a7d4f'],
  U: ['#2f6fa8', '#cfe6f8'],
  B: ['#3a3542', '#ddd8e6'],
  R: ['#b5482f', '#fbd9cd'],
  G: ['#3f7a4d', '#d7ecd9'],
  C: ['#5a5f6b', '#e8ecf3'],
};

export function placeholderArt(name: string, frameKey: ArtFrameKey): string {
  const [bg, fg] = FRAME_COLORS[frameKey] ?? FRAME_COLORS.C;
  const initials = name
    .split(/\s+/)
    .filter((w) => !['of', 'the', 'to', 'and'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
      <rect width="400" height="560" fill="${bg}" opacity="0.35" />
      <rect width="400" height="560" fill="#0a0e16" opacity="0.45" />
      <text x="200" y="290" font-family="Georgia, serif" font-size="120" font-weight="700"
        fill="${fg}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
