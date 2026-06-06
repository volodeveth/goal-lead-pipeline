const RESERVED = /[_*\[\]()~`>#+\-=|{}.!\\]/g;

export function escapeMarkdownV2(text: string): string {
  return text.replace(RESERVED, (m) => `\\${m}`);
}
