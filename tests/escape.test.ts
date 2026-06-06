import { describe, it, expect } from "vitest";
import { escapeMarkdownV2 } from "@/lib/telegram/escape";

describe("escapeMarkdownV2", () => {
  it("escapes all MarkdownV2 reserved characters", () => {
    const input = `_*[]()~\`>#+-=|{}.!`;
    const escaped = escapeMarkdownV2(input);
    for (const ch of "_*[]()~`>#+-=|{}.!") {
      expect(escaped).toContain("\\" + ch);
    }
  });

  it("leaves regular text untouched", () => {
    expect(escapeMarkdownV2("Hello world")).toBe("Hello world");
  });

  it("escapes a typical user phone", () => {
    expect(escapeMarkdownV2("+380971234567")).toBe("\\+380971234567");
  });

  it("escapes nested punctuation like email", () => {
    expect(escapeMarkdownV2("olena@gmail.com")).toBe("olena@gmail\\.com");
  });

  it("handles empty string", () => {
    expect(escapeMarkdownV2("")).toBe("");
  });
});
