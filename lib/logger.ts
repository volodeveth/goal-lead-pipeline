import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "ciel-lead-pipeline" },
  redact: {
    paths: ["email", "phone", "*.email", "*.phone", "lead.email", "lead.phone", "lead.name"],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "[invalid]";
  const visible = user.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return "[short]";
  return `${phone.slice(0, 5)}*****${phone.slice(-2)}`;
}
