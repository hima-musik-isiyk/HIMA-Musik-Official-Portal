export const metadata = {
  title: "Data Deletion Instructions | HIMA Musik ISI Yogyakarta",
  description:
    "Instructions for requesting deletion of data processed by HIMA Musik ISI Yogyakarta.",
};

export default function DataDeletionPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 text-stone-300 md:py-28">
      <p className="text-gold-500 mb-4 text-xs font-semibold tracking-[0.35em] uppercase">
        HIMA Musik ISI Yogyakarta
      </p>
      <h1 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
        Data Deletion Instructions
      </h1>
      <p className="mt-5 text-sm leading-7 text-stone-500">
        Effective date: May 1, 2026. You may request deletion of personal
        information processed by HIMA Musik ISI Yogyakarta, including
        information received through our Instagram notification integration.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-wide text-white">
          How to Request Deletion
        </h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-7 tracking-wide text-stone-400">
          <li>
            Email{" "}
            <a
              href="mailto:musikisiyk@gmail.com"
              className="text-gold-400 underline-offset-4 hover:underline"
            >
              musikisiyk@gmail.com
            </a>{" "}
            with the subject line: Data Deletion Request.
          </li>
          <li>
            Include your Instagram username, the approximate date of the
            interaction, and the type of data you want deleted, such as direct
            message, comment, mention, or form submission.
          </li>
          <li>
            We may ask for limited additional information to verify that the
            request relates to your account or message.
          </li>
          <li>
            After verification, we will delete or anonymize the relevant data
            from systems we control within a reasonable period, unless retention
            is required by law, institutional policy, security, or dispute
            resolution needs.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-wide text-white">
          Scope
        </h2>
        <p className="mt-4 text-sm leading-7 tracking-wide text-stone-400">
          This process applies to data controlled by HIMA Musik ISI Yogyakarta.
          To delete data from Meta or Instagram directly, use the privacy and
          account tools provided by Meta.
        </p>
      </section>
    </article>
  );
}
