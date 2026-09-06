import { Helmet } from '@dr.pogodin/react-helmet';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { home } from 'virtual:content';

const additionalFaqs = [
  {
    id: 'weather',
    question: 'What happens if weather delays my service?',
    answer: 'The provider or Blokpakt will contact you when weather makes the booked work unsafe or impractical. We will offer the next available window, and you will see any change or cancellation terms before confirming it.',
  },
  {
    id: 'screening',
    question: 'How are providers reviewed?',
    answer: 'We review provider identity, service experience, references, and the information needed for the services they offer. Providers must maintain the licenses, permits, and insurance required for their trade and location.',
  },
  {
    id: 'photos',
    question: 'Why does Blokpakt use job photos?',
    answer: 'Before-and-after photos document the service area, help confirm completion, and give customers and providers a shared record if a question or dispute comes up. Photos should focus on the work and avoid people or unrelated private information.',
  },
  {
    id: 'report-problem',
    question: 'How do I report a problem?',
    answer: 'Use the booking or job-tracking page to describe what happened and attach photos. We review the report, contact the provider when needed, and help document a resolution. For immediate safety emergencies, contact local emergency services first.',
  },
  {
    id: 'add-ons',
    question: 'How do additional services and charges work?',
    answer: 'The provider and customer discuss the requested change first. The customer then submits the added service and proposed amount through the Blokpakt website. The provider reviews it, and the customer confirms the scope and price through Blokpakt before optional work begins or an add-on is charged.',
  },
  {
    id: 'access',
    question: 'What should I prepare before the provider arrives?',
    answer: 'Clear personal items from the work area, secure pets, identify gates and water or power access, and tell us about hazards or restricted areas. Providers can only service areas they can safely access.',
  },
];

export default function FaqPage() {
  const bookingFaqs = home.bookingFaq.items;
  const allFaqs = [...bookingFaqs, ...additionalFaqs.filter((item) => !bookingFaqs.some((faq) => faq.id === item.id))];

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | Blokpakt</title>
        <meta name="description" content="Answers about Blokpakt neighborhood service bookings, pricing, providers, add-ons, and problem reporting." />
      </Helmet>

      <main className="bg-background">
        <section className="border-b border-border bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Before you book</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Practical answers before you commit.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
              Learn how neighborhood batches, pricing, providers, service changes, and issue reporting work on Blokpakt.
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-20">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">FAQ topics</p>
            <nav aria-label="FAQ topics" className="space-y-2 border-l border-border pl-4">
              <a href="#booking" className="block text-sm font-medium text-foreground/70 hover:text-accent">Booking</a>
              <a href="#trust" className="block text-sm font-medium text-foreground/70 hover:text-accent">Trust and safety</a>
              <a href="#service-changes" className="block text-sm font-medium text-foreground/70 hover:text-accent">Service changes</a>
            </nav>
          </aside>

          <div className="max-w-3xl space-y-14">
            <section id="booking" className="scroll-mt-28">
              <h2 className="mb-6 text-2xl font-extrabold text-foreground sm:text-3xl">Booking and payment</h2>
              <FaqList items={allFaqs.slice(0, 5)} />
            </section>

            <section id="trust" className="scroll-mt-28">
              <h2 className="mb-6 text-2xl font-extrabold text-foreground sm:text-3xl">Trust and safety</h2>
              <FaqList items={allFaqs.slice(5, 9)} />
            </section>

            <section id="service-changes" className="scroll-mt-28">
              <h2 className="mb-6 text-2xl font-extrabold text-foreground sm:text-3xl">Service changes and preparation</h2>
              <FaqList items={allFaqs.slice(9)} />
            </section>

            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-8">
              <Link to="/book" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent/90">Book a service <ChevronRight size={16} /></Link>
              <Link to="/legal" className="text-sm font-semibold text-primary hover:text-accent">Read our legal policies</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function FaqList({ items }: { items: Array<{ id: string; question: string; answer: string }> }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-bold text-foreground">
            {item.question}
            <ChevronRight size={18} className="shrink-0 text-accent transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-3 max-w-3xl pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}