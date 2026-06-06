const services = [
  { title: "SEO", desc: "Технічний аудит, контент-стратегія, посилання, локальний пошук." },
  { title: "Контекстна реклама", desc: "Google Ads, Bing Ads — від запуску до оптимізації." },
  { title: "SMM", desc: "Контент-плани, реклама в Meta та TikTok, інфлюенсер-маркетинг." },
  { title: "Веб-розробка", desc: "Лендинги, інтернет-магазини, інтеграції з CRM." },
];

export default function ServicesSection() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      {services.map((s) => (
        <div
          key={s.title}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur"
        >
          <h3 className="mb-2 text-xl font-semibold text-white">{s.title}</h3>
          <p className="text-neutral-400">{s.desc}</p>
        </div>
      ))}
    </section>
  );
}
