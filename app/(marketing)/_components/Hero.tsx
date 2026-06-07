/* eslint-disable @next/next/no-img-element */
export default function Hero() {
  return (
    <section className="flex flex-col items-start gap-6 pt-8">
      <img src="/logo.svg" alt="Ціль" height={48} className="h-12 w-auto" />
      <h1 className="max-w-3xl text-4xl leading-tight font-bold text-white md:text-6xl">
        Запустимо вашу маркетингову кампанію за{" "}
        <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
          тиждень
        </span>
      </h1>
      <p className="max-w-2xl text-lg text-neutral-300">
        SEO, контекстна реклама, SMM і веб-розробка під ключ. Розкажіть про свій продукт — підберемо
        канали, які дадуть результат.
      </p>
      <a
        href="#contact"
        className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-neutral-950 transition hover:bg-amber-300"
      >
        Залишити заявку
      </a>
    </section>
  );
}
