import { Helmet } from '@dr.pogodin/react-helmet';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

const story = [
  {
    id: 'what-is-blokpakt',
    question: 'What is Blokpakt?',
    answer: 'Blokpakt is a hyper-local property-maintenance platform designed to bring neighbors and local service providers together. It focuses on services like lawn care, gutter cleaning, and pressure washing.',
  },
  {
    id: 'problem',
    question: 'What problem are we trying to solve?',
    answer: 'For field contractors, unpaid driving time can eat into the workday. A provider might spend 45 minutes driving across town for a $45 job, then do it all again for the next appointment. That is time and fuel spent getting between jobs instead of doing paid work.',
  },
  {
    id: 'batching',
    question: 'How does neighborhood batching work?',
    answer: 'Blokpakt is designed to group nearby service requests into dense neighborhood routes. Instead of driving across town for one appointment, providers can claim multiple jobs on the same block or street, park once, and work at several homes in a row.',
  },
  {
    id: 'provider-experience',
    question: 'What is the provider experience meant to be like?',
    answer: 'As simple and straightforward as using a delivery app: claim the block, do the work, snap a photo, and get paid. The goal is to keep the process effortless so providers can focus on the jobs, not unnecessary coordination.',
  },
  {
    id: 'homeowners',
    question: 'What does this mean for homeowners?',
    answer: 'Homeowners can request routine services alongside nearby neighbors. By bringing jobs together in the same area, Blokpakt aims to make local property maintenance faster, more reliable, and more convenient for the community.',
  },
  {
    id: 'mission',
    question: 'Why are we building Blokpakt?',
    answer: 'We believe local services work better when nearby jobs are brought together. Blokpakt is built to reduce wasted driving for providers and make it easier for neighbors to get property maintenance done close to home.',
  },
];

export default function OurStoryPage() {
  return (
    <>
      <Helmet>
        <title>Our Story | Blokpakt</title>
        <meta name="description" content="Learn why Blokpakt brings neighborhood property-maintenance jobs together to reduce contractor driving time and make local services easier." />
      </Helmet>

      <main className="bg-background">
        <section className="border-b border-border bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Our Story</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Less driving. More work on the block.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
              Blokpakt brings neighbors and local providers together to make property maintenance work better at the neighborhood level.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <section aria-label="About Blokpakt" className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-extrabold text-foreground sm:text-3xl">Why Blokpakt?</h2>
            <div className="divide-y divide-border border-y border-border">
              {story.map((item) => (
                <details key={item.id} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-bold text-foreground">
                    {item.question}
                    <ChevronRight size={18} className="shrink-0 text-accent transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 max-w-3xl pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-8">
              <Link to="/join" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent/90">
                Join as a provider <ChevronRight size={16} />
              </Link>
              <Link to="/book" className="text-sm font-semibold text-primary hover:text-accent">Explore services</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
