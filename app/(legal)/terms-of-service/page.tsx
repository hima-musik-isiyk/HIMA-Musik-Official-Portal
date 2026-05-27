export const metadata = {
  title: "Terms of Service | HIMA Musik ISI Yogyakarta",
  description:
    "Terms of service for HIMA Musik ISI Yogyakarta website and connected services.",
};

const terms = [
  {
    title: "Use of Services",
    body: "This website and connected services are provided for HIMA Musik ISI Yogyakarta organizational communication, publication, administration, and student services. You agree to use them lawfully and respectfully.",
  },
  {
    title: "Instagram and Discord Integration",
    body: "Our Instagram notification integration may forward Instagram webhook events, such as direct messages, comments, mentions, and related metadata, to an internal Discord channel used by authorized administrators.",
  },
  {
    title: "User Content",
    body: "When you send messages, comments, mentions, forms, or other content to HIMA Musik ISI Yogyakarta, you are responsible for the accuracy and legality of that content. Do not submit unlawful, abusive, or misleading material.",
  },
  {
    title: "Availability",
    body: "We try to keep services available and accurate, but we do not guarantee uninterrupted operation, error-free content, or permanent availability of third-party platform integrations.",
  },
  {
    title: "Changes",
    body: "We may update these terms when our services, organization needs, or platform requirements change. The latest version will be published on this page.",
  },
  {
    title: "Contact",
    body: "Questions about these terms can be sent to musikisiyk@gmail.com.",
  },
];

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 text-stone-300 md:py-28">
      <p className="text-gold-500 mb-4 text-xs font-semibold tracking-[0.35em] uppercase">
        HIMA Musik ISI Yogyakarta
      </p>
      <h1 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
        Terms of Service
      </h1>
      <p className="mt-5 text-sm leading-7 text-stone-500">
        Effective date: May 1, 2026. These terms apply to this website and
        connected services operated by HIMA Musik ISI Yogyakarta.
      </p>

      <div className="mt-12 space-y-10">
        {terms.map((term) => (
          <section key={term.title}>
            <h2 className="text-lg font-semibold tracking-wide text-white">
              {term.title}
            </h2>
            <p className="mt-4 text-sm leading-7 tracking-wide text-stone-400">
              {term.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
