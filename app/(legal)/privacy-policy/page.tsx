export const metadata = {
  title: "Privacy Policy | HIMA Musik ISI Yogyakarta",
  description:
    "Privacy policy for HIMA Musik ISI Yogyakarta services and Instagram notification integration.",
};

const sections = [
  {
    title: "Information We Receive",
    body: [
      "HIMA Musik ISI Yogyakarta may receive information that you voluntarily send to our official Instagram account, including Instagram-scoped user IDs, usernames, direct messages, comments, mentions, message timestamps, and related media or story references provided by Meta webhook events.",
      "We may also receive basic technical information needed to operate this website, such as request logs, device/browser information, and form submission metadata.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use Instagram webhook information to notify authorized HIMA Musik administrators in our internal Discord workspace, respond to messages, moderate comments, document organization communication, and maintain student service workflows.",
      "We do not sell personal information. We do not use Instagram webhook data for third-party advertising.",
    ],
  },
  {
    title: "Sharing and Access",
    body: [
      "Access is limited to authorized HIMA Musik administrators who need the information for organization communication, moderation, and student services.",
      "We may disclose information if required by law, institutional policy, platform policy, or to protect the safety and integrity of our services.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Webhook notifications may be retained in Discord or operational logs for administrative continuity. We keep information only as long as needed for organization operations, compliance, dispute handling, or technical troubleshooting.",
      "You may request deletion using the contact information below.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You may avoid sending direct messages, comments, or mentions to our Instagram account if you do not want that information processed by this integration.",
      "You may request access, correction, or deletion of your information by emailing musikisiyk@gmail.com.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy questions or data requests, contact HIMA Musik ISI Yogyakarta at musikisiyk@gmail.com.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 text-stone-300 md:py-28">
      <p className="text-gold-500 mb-4 text-xs font-semibold tracking-[0.35em] uppercase">
        HIMA Musik ISI Yogyakarta
      </p>
      <h1 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-5 text-sm leading-7 text-stone-500">
        Effective date: May 1, 2026. This policy explains how HIMA Musik ISI
        Yogyakarta handles information connected to this website and our
        Instagram notification integration for Discord Fishing.
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold tracking-wide text-white">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 tracking-wide text-stone-400"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
