"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  name: z.string().min(1, "Введіть ім'я"),
  email: z.email("Некоректний email"),
  phone: z.string().min(5, "Введіть телефон"),
  company: z.string().optional(),
  serviceInterest: z.array(z.string()).min(1, "Оберіть хоча б одну послугу"),
  budgetRange: z.string().optional(),
  message: z.string().min(5, "Опишіть запит"),
});

type FormData = z.infer<typeof FormSchema>;

const SERVICES = ["SEO", "Контекстна реклама", "SMM", "Веб-розробка"];
const BUDGETS = ["<1k", "1k-5k", "5k-15k", "15k-50k", ">50k", "not_sure"];

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { serviceInterest: [] },
  });

  const onSubmit = async (values: FormData) => {
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const utm = readUtmFromUrl();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          budgetRange: values.budgetRange || undefined,
          utm,
        }),
      });
      const body = await res.json();
      if (res.status === 202 || res.status === 409) {
        setLeadId(body.id);
        setStatus("success");
        reset();
        return;
      }
      if (res.status === 400 && body.issues) {
        setErrorMsg(body.issues.map((i: { message: string }) => i.message).join("; "));
      } else if (res.status === 429) {
        setErrorMsg("Забагато спроб. Спробуйте за хвилину.");
      } else {
        setErrorMsg("Сталася помилка. Спробуйте ще раз.");
      }
      setStatus("error");
    } catch {
      setErrorMsg("Не вдалося надіслати. Перевірте зʼєднання.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-emerald-200">
        <h3 className="mb-2 text-xl font-semibold">Дякуємо!</h3>
        <p>
          Заявку прийнято. Менеджер зв&apos;яжеться з вами протягом години.
          {leadId && (
            <span className="mt-2 block text-xs text-emerald-300/70">
              ID заявки: <code>{leadId}</code>
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      noValidate
    >
      <Field label="Імʼя" error={errors.name?.message}>
        <input
          {...register("name")}
          autoComplete="name"
          className="ciel-input"
          placeholder="Олена Іваненко"
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className="ciel-input"
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Телефон" error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          autoComplete="tel"
          className="ciel-input"
          placeholder="+38 (097) 123-45-67"
        />
      </Field>

      <Field label="Компанія (опційно)" error={errors.company?.message}>
        <input {...register("company")} className="ciel-input" placeholder="Acme LLC" />
      </Field>

      <Field
        label="Які послуги цікавлять?"
        error={errors.serviceInterest?.message as string | undefined}
        className="md:col-span-2"
      >
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10 has-[:checked]:text-amber-200 hover:border-amber-400"
            >
              <input
                type="checkbox"
                value={s}
                {...register("serviceInterest")}
                className="hidden"
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Орієнтовний бюджет" error={errors.budgetRange?.message}>
        <select {...register("budgetRange")} className="ciel-input">
          <option value="">— Оберіть —</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {b === "not_sure" ? "ще не визначився" : `$${b}`}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Що потрібно зробити?" error={errors.message?.message} className="md:col-span-2">
        <textarea
          {...register("message")}
          className="ciel-input min-h-32"
          placeholder="Опишіть продукт, цілі, дедлайни"
        />
      </Field>

      {errorMsg && (
        <p className="text-sm text-rose-300 md:col-span-2" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {status === "submitting" ? "Надсилаємо…" : "Надіслати заявку"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </label>
  );
}

function readUtmFromUrl(): { source?: string; medium?: string; campaign?: string } | undefined {
  if (typeof window === "undefined") return undefined;
  const p = new URLSearchParams(window.location.search);
  const source = p.get("utm_source") ?? undefined;
  const medium = p.get("utm_medium") ?? undefined;
  const campaign = p.get("utm_campaign") ?? undefined;
  if (!source && !medium && !campaign) return undefined;
  return { source, medium, campaign };
}
