const bodyText = "text-base leading-relaxed text-foreground/85";
const h2 =
  "font-display text-lg tracking-[0.12em] uppercase border-b-[3px] border-foreground pb-2 mt-10 mb-4";
const list =
  "list-disc pl-6 space-y-1.5 text-base leading-relaxed text-foreground/85";

export default function TermsOfService() {
  return (
    <div className="bg-paper">
      <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="mb-6 text-4xl font-bold md:text-5xl">
          Terms of Service
        </h1>
        <p className={bodyText}>
          <strong>Effective Date:</strong> July 30, 2026
          <br />
          <strong>Service:</strong> Passport ATL
        </p>

        <p className={`${bodyText} mt-4`}>
          These Terms govern your use of Passport ATL, including its digital
          passport, stamps, rewards, routes, events, business listings, and
          related services. By creating an account or using the service, you
          agree to these Terms.
        </p>

        <h2 className={h2}>Account Eligibility and Security</h2>
        <ul className={list}>
          <li>You must provide accurate account information.</li>
          <li>
            You are responsible for activity performed through your account.
          </li>
          <li>
            You may not share, transfer, automate, or misuse stamps or rewards.
          </li>
          <li>
            Users under 13 may not create an account without a lawful
            parent-managed process offered by Passport ATL.
          </li>
        </ul>

        <h2 className={h2}>Stamps, Rewards, and Offers</h2>
        <p className={bodyText}>
          Stamps, rewards, offers, and promotional benefits have no cash value
          unless expressly stated. Eligibility, availability, expiration,
          redemption limits, and participating locations may change. Passport
          ATL may correct mistakes, investigate suspected misuse, and void
          improperly obtained stamps or rewards.
        </p>

        <h2 className={h2}>Third-Party Businesses and Events</h2>
        <p className={bodyText}>
          Passport ATL helps users discover independent businesses, venues,
          organizers, and events. Unless explicitly stated, Passport ATL does
          not operate or control those third parties and is not responsible for
          their products, services, hours, cancellations, admission policies,
          accessibility, safety, or transactions.
        </p>

        <h2 className={h2}>Acceptable Use</h2>
        <p className={bodyText}>You may not:</p>
        <ul className={`${list} mt-3`}>
          <li>Use the service unlawfully or fraudulently.</li>
          <li>Interfere with the service or attempt unauthorized access.</li>
          <li>Copy, scrape, resell, or exploit platform content at scale.</li>
          <li>Submit false, misleading, infringing, or harmful material.</li>
        </ul>

        <h2 className={h2}>Changes and Availability</h2>
        <p className={bodyText}>
          We may improve, suspend, or discontinue features and may update these
          Terms. Material changes will be posted with an updated effective date.
          Continued use after an update means you accept the revised Terms.
        </p>

        <h2 className={h2}>Disclaimer and Limitation</h2>
        <p className={bodyText}>
          Passport ATL is provided on an “as available” basis. To the extent
          permitted by law, Passport ATL disclaims implied warranties and is not
          liable for indirect, incidental, special, or consequential damages
          arising from use of the service or third-party offerings.
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={bodyText}>
          Questions about these Terms may be sent to{" "}
          <a href="mailto:info@passportatl.com" className="font-bold underline">
            info@passportatl.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
