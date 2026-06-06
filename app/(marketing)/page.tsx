import Hero from "./_components/Hero";
import ServicesSection from "./_components/ServicesSection";
import LeadForm from "./_components/LeadForm";

export default function MarketingHome() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-24 px-6 py-12 md:py-20">
      <Hero />
      <ServicesSection />
      <section
        id="contact"
        className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur md:p-10"
      >
        <h2 className="mb-2 text-3xl font-semibold text-white">Залиште заявку</h2>
        <p className="mb-8 text-neutral-400">
          Менеджер зв&apos;яжеться з вами протягом години у робочий час.
        </p>
        <LeadForm />
      </section>
    </main>
  );
}
