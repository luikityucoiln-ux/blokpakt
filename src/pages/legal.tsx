import { Helmet } from '@dr.pogodin/react-helmet';

const legalSections = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: 'How Blokpakt collects, uses, shares, and protects information in connection with our website and services.',
    paragraphs: [
      'Effective date: September 1, 2026. Blokpakt, Inc. ("Blokpakt," "we," "us," or "our") provides neighborhood home-service coordination in the United States. This Privacy Policy describes the information we collect when you visit our website, request a service, join a neighborhood booking, contact us, or otherwise use our platform.',
      'We may collect contact and account information, service addresses, booking details, payment and transaction information, communications, device and usage data, and information you choose to provide about your property or service needs. We use this information to provide and improve the platform, coordinate contractors, process payments, communicate with you, prevent fraud, maintain security, and comply with law.',
      'We share information with service providers that help us operate the platform, contractors involved in a requested service, payment processors, professional advisers, and government authorities when legally required. We do not sell your personal information for money. Depending on your state of residence, you may have rights to access, correct, delete, or limit certain uses of your information. Contact us at privacy@blokpakt.com to make a request.',
      'We retain information only for as long as reasonably necessary for the purposes described above, including legal, accounting, dispute-resolution, and security needs. We use administrative, technical, and physical safeguards, but no internet transmission or storage system can be guaranteed to be completely secure.',
    ],
  },
  {
    id: 'state-privacy-retention',
    title: 'State Privacy Rights and Data Retention',
    summary: 'Additional privacy disclosures and retention practices for customers and providers in U.S. states with applicable privacy laws.',
    paragraphs: [
      'Residents of states including California, Colorado, Connecticut, Utah, Virginia, and other states with applicable comprehensive privacy laws may have rights to confirm whether we process personal information, access or correct it, request deletion or portability, opt out of certain targeted advertising or profiling, and appeal a denied request. Available rights depend on your state and the applicable legal exceptions.',
      'To submit a privacy request, email privacy@blokpakt.com with your name, state of residence, the request you are making, and enough information for us to verify your identity. We will not discriminate against you for exercising a privacy right. We may ask for additional information to prevent unauthorized requests, and you may use an authorized agent where permitted by law.',
      'We keep information for different periods based on its purpose: account and transaction records may be retained for business, tax, accounting, and dispute needs; service communications and job records may be retained to administer warranties and resolve claims; security and consent records may be retained to demonstrate compliance and prevent abuse. When information is no longer reasonably needed, we delete it, de-identify it, or securely restrict access, subject to legal holds and other lawful exceptions.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    summary: 'How cookies and similar technologies support essential features, preferences, analytics, and measurement.',
    paragraphs: [
      'Blokpakt uses cookies, local storage, pixels, and similar technologies to keep the site working, remember preferences, understand usage, and measure the performance of our communications. Essential technologies are needed for functions such as security and navigation.',
      'With your permission where required, we may use analytics or advertising technologies that help us understand engagement and deliver more relevant communications. You can change your preferences through the cookie controls shown on the site or through your browser settings. Blocking some technologies may affect site functionality.',
      'Our providers may process information on our behalf and may set their own cookies subject to their privacy policies. We honor applicable opt-out signals and consent choices to the extent required by law.',
    ],
  },
  {
    id: 'ad-choices',
    title: 'Ad Choices',
    summary: 'Your choices about interest-based advertising and measurement technologies.',
    paragraphs: [
      'Blokpakt may work with advertising and measurement partners to show messages on our site or on other websites. These partners may use browser identifiers, device information, and activity signals to limit repeated ads, measure campaigns, or infer general interests. We do not use these technologies to make decisions about eligibility for essential services.',
      'You can manage non-essential advertising cookies through our cookie controls. You may also visit industry choice tools such as the Digital Advertising Alliance at optout.aboutads.info and the Network Advertising Initiative at optout.networkadvertising.org. Choices are generally browser- and device-specific and may need to be renewed after deleting cookies.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms and Conditions',
    summary: 'The rules governing access to and use of the Blokpakt platform.',
    paragraphs: [
      'By accessing or using Blokpakt, you agree to these Terms and Conditions and any additional terms presented for a particular feature. If you do not agree, do not use the platform. You must be at least 18 years old and able to form a binding contract under applicable law.',
      'Blokpakt helps customers organize shared demand for home services and may connect customers with independent contractors. Unless expressly stated otherwise, contractors are independent businesses and are responsible for their work, licenses, insurance, schedules, pricing, and compliance obligations. A booking is subject to availability and the service terms shown at checkout.',
      'You agree to provide accurate information, use the platform lawfully, protect your account credentials, and avoid interfering with the platform or misusing another person\'s information. We may suspend or terminate access for fraud, abuse, security concerns, or violation of these terms. To the maximum extent permitted by law, the platform is provided without warranties beyond those that cannot legally be excluded.',
      'These terms are governed by the laws of the State of Delaware, without regard to conflict-of-law rules. Disputes will be handled in the state or federal courts located in Delaware unless applicable law requires another forum. Nothing in these terms limits rights that cannot be waived under applicable consumer-protection law.',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Notice',
    summary: 'Ownership and permitted use of Blokpakt content, trademarks, software, and submitted materials.',
    paragraphs: [
      'The Blokpakt name, logos, service marks, software, interface, text, graphics, and other platform content are owned by Blokpakt or its licensors and are protected by United States and international intellectual-property laws. You may use the platform for its intended personal or business purpose, but you may not copy, modify, distribute, reverse engineer, frame, scrape, or create derivative works from it without written permission.',
      'You retain ownership of content you submit. By submitting content, you grant Blokpakt a non-exclusive, worldwide, royalty-free license to host, reproduce, adapt, and display it as needed to operate, secure, improve, and promote the platform. You represent that you have the rights needed to grant this license and that your submission does not violate another person\'s rights.',
      'If you believe content on the platform infringes your copyright, send a notice identifying the copyrighted work, the allegedly infringing material, your contact information, and the required good-faith statements to copyright@blokpakt.com. We may remove material and restrict repeat infringement in accordance with applicable law.',
    ],
  },
  {
    id: 'property-access-photos',
    title: 'Property Access and Photo Authorization',
    summary: 'The permissions and expectations for entering a service location and taking job-related photos.',
    paragraphs: [
      'When you book a service, you authorize the assigned provider to enter the portions of the property reasonably necessary to perform the agreed work during the scheduled service window. You are responsible for providing lawful access, identifying gates, pets, hazards, utilities, or restricted areas, and obtaining permission from any owner, tenant, or other person whose consent is required.',
      'You authorize the provider and Blokpakt to take reasonable photos or videos of the work area and completed work for estimating, dispatch, quality assurance, safety, payment records, customer support, and dispute resolution. Job media should be limited to the property and work and should avoid people, private documents, license plates, and unrelated neighboring property whenever reasonably possible.',
      'Job photos and videos may be shared with the customer, provider, Blokpakt staff, insurers, payment partners, or other parties involved in resolving a service issue. We will not use identifiable job media for public marketing without a separate permission when one is required. You can ask us to review a photo concern by contacting support@blokpakt.com, subject to legal, safety, fraud-prevention, and dispute-record exceptions.',
    ],
  },
  {
    id: 'platform-rules',
    title: 'Platform Rules',
    summary: 'Community and marketplace expectations for customers, contractors, and neighborhood participants.',
    paragraphs: [
      'Use the platform honestly and respectfully. Do not impersonate another person, submit false reviews or bookings, manipulate neighborhood participation, harass users or contractors, upload unlawful or harmful material, disclose private information, attempt unauthorized access, introduce malicious code, or use automated tools to disrupt or extract platform data.',
      'Customers must provide safe and lawful access to service locations, disclose material conditions that could affect a job, and treat contractors with respect. Contractors must maintain any legally required licenses and insurance, communicate accurately, perform agreed work professionally, and protect customer information. Report safety concerns, suspected fraud, or rule violations to support@blokpakt.com.',
      'We may investigate reports, remove content, cancel bookings, withhold access, or take other appropriate action when these rules are violated or when necessary to protect people, property, or the platform. These rules supplement, and do not replace, any service-specific agreement or applicable law.',
    ],
  },
  {
    id: 'scope-changes-add-ons',
    title: 'Service Scope Changes and Additional Charges',
    summary: 'How customers and providers discuss, document, and approve work or charges beyond the original booking.',
    paragraphs: [
      'A provider must discuss any requested change in service scope with the customer before performing work outside the original booking. This includes an added service, extra area, additional materials, changed access conditions, or work required because the property differs materially from the booking description. Customers and providers may discuss the proposed work directly, but the change is not approved merely because it was discussed in person or by phone.',
      'After discussing the change, the customer must use the Blokpakt website to submit what additional service is requested and the proposed amount, including any relevant description, quantity, or timing. The provider should review the submission and confirm or decline it through the available Blokpakt workflow. Blokpakt will use the submitted information to create a written record of the requested scope and price for the customer, provider, and platform.',
      'The provider must not begin optional additional work until the customer has confirmed the scope and price through Blokpakt, except for urgent steps reasonably necessary to prevent immediate property damage or a safety hazard. Approved add-on charges may be collected using the payment method associated with the booking. A provider may not require cash or an off-platform payment for a service that should be recorded through Blokpakt.',
      'If the customer and provider cannot agree on the scope or amount, the provider should complete only the original approved scope where reasonably possible and contact Blokpakt support for help. Emergency work, taxes, permits, cancellation charges, or other amounts required by applicable law or expressly disclosed at booking may be handled under the applicable service terms.',
    ],
  },
];

export default function LegalPage() {
  return (
    <>
      <Helmet>
        <title>Legal Center | Blokpakt</title>
        <meta
          name="description"
          content="Blokpakt privacy, state privacy rights, cookies, advertising choices, property access, service changes, terms, intellectual property, and platform rules."
        />
      </Helmet>

      <main className="bg-background">
        <section className="border-b border-border bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Blokpakt Legal Center</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Clear rules for a better block.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
              Find the policies and standards that govern your use of Blokpakt. These materials are written for our United States operations and are provided for general information, not legal advice.
            </p>
            <p className="mt-5 text-sm text-primary-foreground/60">Last updated September 1, 2026</p>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-20">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
            <nav aria-label="Legal documents" className="space-y-2 border-l border-border pl-4">
              {legalSections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="block text-sm font-medium text-foreground/70 transition-colors hover:text-accent">
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="max-w-3xl space-y-16">
            {legalSections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-border pb-12 last:border-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Policy {String(index + 1).padStart(2, '0')}</p>
                <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{section.title}</h2>
                <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground">{section.summary}</p>
                <div className="mt-7 space-y-5 text-sm leading-7 text-foreground/75">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}

          </div>
        </div>
      </main>
    </>
  );
}