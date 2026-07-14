const bodyText = "text-base leading-relaxed text-foreground/85";
const h2 = "font-display text-lg tracking-[0.12em] uppercase border-b-[3px] border-foreground pb-2 mt-10 mb-4";
const list = "list-disc pl-6 space-y-1.5 text-base leading-relaxed text-foreground/85";

export default function PrivacyPolicy() {
  return (
    <div className="bg-paper">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Privacy Policy</h1>

        <p className={bodyText}>
          <strong>Effective Date:</strong> July 14, 2026
          <br />
          <strong>Website:</strong>{" "}
          <a href="https://passportatl.com" className="underline">
            https://passportatl.com
          </a>
          <br />
          <strong>Business:</strong> Passport ATL
        </p>

        <p className={`${bodyText} mt-4`}>
          Passport ATL helps users discover Atlanta neighborhoods, events, local businesses,
          routes, rewards, and passport stamp experiences. This Privacy Policy explains how we
          collect, use, store, and protect information when you use our website, digital
          passport, event listings, route pages, forms, and related services.
        </p>

        <h2 className={h2}>Information We Collect</h2>
        <p className={bodyText}>We may collect the following types of information:</p>
        <p className={`${bodyText} mt-4`}>
          <strong>Information you provide directly:</strong>
          <br />
          This may include your name, email address, phone number, business name, event details,
          vendor information, partnership inquiries, contest or reward submissions, and messages
          submitted through forms on our website.
        </p>
        <p className={`${bodyText} mt-4`}>
          <strong>Passport and participation information:</strong>
          <br />
          If you use Passport ATL features, we may collect information related to digital stamp
          activity, event check-ins, reward redemptions, route engagement, and participating
          business interactions.
        </p>
        <p className={`${bodyText} mt-4`}>
          <strong>Website usage information:</strong>
          <br />
          We may collect general technical information such as browser type, device type, pages
          visited, referral source, approximate location, and other analytics data to help us
          improve the website and user experience.
        </p>
        <p className={`${bodyText} mt-4`}>
          <strong>Google user data, if applicable:</strong>
          <br />
          If Passport ATL uses Google services such as Google Sign-In, Google Maps, Google
          Sheets, Google Drive, or other Google API services, we only request access to the
          information needed to provide the feature being used. This may include basic profile
          information, email address, map/location-related functionality, or data needed to
          submit, organize, or display event or business information.
        </p>

        <h2 className={h2}>How We Use Information</h2>
        <p className={bodyText}>We use collected information to:</p>
        <ul className={`${list} mt-3`}>
          <li>Provide and improve Passport ATL services</li>
          <li>Display local events, routes, business listings, and passport offers</li>
          <li>Manage passport stamps, rewards, and participation records</li>
          <li>Respond to user, vendor, sponsor, and business inquiries</li>
          <li>Review submitted events, business listings, or partnership requests</li>
          <li>Improve website performance, content, and user experience</li>
          <li>
            Communicate updates about Passport ATL, events, routes, rewards, or partner
            opportunities
          </li>
          <li>Maintain security and prevent misuse of our website or services</li>
          <li>Comply with legal, technical, or platform requirements</li>
        </ul>

        <h2 className={h2}>Use of Google User Data</h2>
        <p className={bodyText}>
          Passport ATL’s use of information received from Google APIs will comply with the
          Google API Services User Data Policy, including the Limited Use requirements.
        </p>
        <p className={`${bodyText} mt-4`}>
          We do not sell Google user data.
          <br />
          We do not use Google user data for advertising, retargeting, or credit-worthiness
          decisions.
          <br />
          We do not transfer Google user data to third parties except when necessary to provide
          user-facing Passport ATL features, comply with the law, protect security, or with the
          user’s consent.
        </p>
        <p className={`${bodyText} mt-4`}>
          Google user data is only used for the purpose disclosed at the time access is
          requested.
        </p>

        <h2 className={h2}>How We Share Information</h2>
        <p className={bodyText}>We may share limited information with:</p>
        <ul className={`${list} mt-3`}>
          <li>
            Service providers that help operate our website, forms, analytics, email, maps,
            hosting, or digital tools
          </li>
          <li>
            Passport ATL business partners when necessary to fulfill rewards, offers, event
            listings, or stamp-related experiences
          </li>
          <li>Legal or regulatory authorities if required by law</li>
          <li>
            Internal team members, contractors, or approved collaborators who need access to
            support Passport ATL operations
          </li>
        </ul>
        <p className={`${bodyText} mt-4`}>We do not sell personal information.</p>

        <h2 className={h2}>Data Storage and Security</h2>
        <p className={bodyText}>
          We take reasonable steps to protect information from unauthorized access, misuse,
          loss, disclosure, or alteration. No online system is completely secure, but we aim to
          use appropriate safeguards for the type of information collected.
        </p>
        <p className={`${bodyText} mt-4`}>
          Information may be stored in website systems, form tools, email platforms,
          spreadsheets, analytics tools, or other services used to operate Passport ATL.
        </p>

        <h2 className={h2}>Data Retention</h2>
        <p className={bodyText}>
          We keep information only as long as reasonably needed to provide services, manage
          business operations, comply with legal obligations, resolve disputes, and improve
          Passport ATL. Users may request deletion of their personal information by contacting
          us.
        </p>

        <h2 className={h2}>Cookies and Analytics</h2>
        <p className={bodyText}>
          Passport ATL may use cookies, analytics tools, pixels, or similar technologies to
          understand site traffic, improve content, measure engagement, and support website
          functionality. Users can adjust browser settings to limit or block cookies.
        </p>

        <h2 className={h2}>Third-Party Links</h2>
        <p className={bodyText}>
          Our website may link to third-party websites, including event pages, ticketing
          platforms, social media pages, restaurants, venues, sponsors, and local businesses.
          Passport ATL is not responsible for the privacy practices or content of third-party
          websites.
        </p>

        <h2 className={h2}>Children’s Privacy</h2>
        <p className={bodyText}>
          Passport ATL is intended for a general audience and is not directed primarily to
          children under 13. We do not knowingly collect personal information from children
          under 13. If we learn that we have collected such information, we will take reasonable
          steps to delete it.
        </p>

        <h2 className={h2}>Your Choices</h2>
        <p className={bodyText}>You may request to:</p>
        <ul className={`${list} mt-3`}>
          <li>Access the personal information we have about you</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your personal information</li>
          <li>Opt out of non-essential communications</li>
          <li>Ask questions about how your information is used</li>
        </ul>
        <p className={`${bodyText} mt-4`}>
          To make a request, contact us using the information below.
        </p>

        <h2 className={h2}>Contact Us</h2>
        <p className={bodyText}>For questions about this Privacy Policy or your data, contact:</p>
        <p className={`${bodyText} mt-4`}>
          <strong>Passport ATL</strong>
          <br />
          Email:{" "}
          <a href="mailto:touristpassportatl@gmail.com" className="underline">
            touristpassportatl@gmail.com
          </a>
          <br />
          Website:{" "}
          <a href="https://passportatl.com" className="underline">
            https://passportatl.com
          </a>
        </p>

        <h2 className={h2}>Updates to This Policy</h2>
        <p className={bodyText}>
          We may update this Privacy Policy from time to time. Updates will be posted on this
          page with a revised effective date. Continued use of Passport ATL after updates means
          you accept the revised policy.
        </p>
      </div>
    </div>
  );
}
