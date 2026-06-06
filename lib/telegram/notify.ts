import pRetry, { AbortError } from "p-retry";
import { TelegramError } from "@/lib/errors";
import { formatLeadMessage, type FormatLeadInput } from "@/lib/telegram/formatMessage";

export type SendTelegramInput = FormatLeadInput & {
  botToken: string;
  chatId: string;
  retries?: number;
  minTimeoutMs?: number;
};

export async function sendTelegramNotification(
  input: SendTelegramInput,
): Promise<{ messageId: string }> {
  const { botToken, chatId, retries = 3, minTimeoutMs = 500 } = input;
  const text = formatLeadMessage(input);
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  return pRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        }),
      });

      if (res.status >= 400 && res.status < 500) {
        const body = await res.text();
        throw new AbortError(new TelegramError(`Telegram ${res.status}: ${body}`));
      }
      if (!res.ok) {
        const body = await res.text();
        throw new TelegramError(`Telegram ${res.status}: ${body}`);
      }

      const data = (await res.json()) as { result?: { message_id?: number } };
      if (!data.result?.message_id) {
        throw new AbortError(
          new TelegramError(`Unexpected Telegram body: ${JSON.stringify(data)}`),
        );
      }
      return { messageId: String(data.result.message_id) };
    },
    { retries, minTimeout: minTimeoutMs, factor: 2 },
  );
}
