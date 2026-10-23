import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowDown, ArrowUpRight, ChevronRight, House, Leaf, MapPin, Route, Users } from 'lucide-react';
import { Link } from 'react-router';

const story = [
  {
    id: 'what-is-blokpakt',
    question: 'What is Blokpakt?',
    answer: 'Blokpakt is an asset-light home-services marketplace designed to bring neighbors and independent local providers together. It focuses on services like lawn care, gutter cleaning, and pressure washing.',
  },
  {
    id: 'problem',
    question: 'What problem are we trying to solve?',
    answer: 'For independent providers, unpaid driving time can eat into the workday. Scattered appointments mean time and fuel spent getting between jobs instead of doing the work. For households, finding a provider and coordinating the details can be its own project.',
  },
  {
    id: 'batching',
    question: 'How does neighborhood batching work?',
    answer: 'Blokpakt is designed to group nearby service requests into dense neighborhood routes. Instead of driving across town for one appointment, providers can claim multiple jobs on the same block or street, park once, and work at several homes in a row.',
  },
  {
    id: 'provider-experience',
    question: 'What is the provider experience meant to be like?',
    answer: 'The goal is a straightforward experience that lets independent providers focus on the work, not unnecessary coordination. Block claiming, job photos, and earnings screens are currently demo concepts. In the US pilot, an operator coordinates availability, quotes, and timing manually; no online payments or automatic dispatch are enabled.',
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
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-48 h-[36rem] w-[36rem] rounded-full border border-white/10" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                <span className="h-2 w-2 rounded-full bg-accent" /> Our Story
              </p>
              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">Less driving.{' '}<br /><span className="text-orange-300">More work</span>{' '}<br />on the block.</h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
                Blokpakt brings neighbors and local providers together to make property maintenance work better at the neighborhood level.
              </p>
              <a href="#why-blokpakt" className="mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                A little closer. A better way. <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="rounded-[2rem] border border-white/20 bg-white/5 p-5 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">The neighborhood idea</p>
                <MapPin size={18} className="text-orange-300" aria-hidden="true" />
              </div>
              <div aria-hidden="true" className="relative my-10">
                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                  {[0, 1, 2].map((home) => (
                    <div key={home} className={`flex aspect-square items-center justify-center rounded-2xl border ${home === 1 ? 'border-orange-300/50 bg-accent text-white shadow-lg' : 'border-white/20 bg-white/10 text-white/80'}`}>
                      <House className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={1.3} />
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-4 h-8 w-2/3 rounded-b-2xl border-x-2 border-b-2 border-dashed border-orange-300/60" />
                <div className="mx-auto flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-orange-200 text-primary shadow-lg"><Route size={21} /></div>
              </div>
              <p className="text-2xl font-bold tracking-tight">Good things happen<br />closer to home.</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">Nearby homes. Similar needs. A more connected way to organize the work.</p>
              <p className="mt-6 border-t border-white/15 pt-4 text-xs text-white/60">Concept illustration, not a live route or service area.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <section aria-label="What we are working toward" className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Users, title: 'Neighbors, not scattered jobs.', text: 'Bring similar home-service needs together, starting with the people nearby.' },
              { icon: Route, title: 'More work. Less in between.', text: 'Explore whether denser work can mean less travel for independent providers.' },
              { icon: Leaf, title: 'Start small. Learn locally.', text: 'Build a manually operated US pilot and improve what the evidence supports.' },
            ].map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                <div className="mb-7 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary"><item.icon size={22} aria-hidden="true" /></span>
                  <span className="text-xs font-semibold tracking-widest text-muted-foreground">0{index + 1}</span>
                </div>
                <h2 className="text-lg font-extrabold text-primary">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </section>

          <section id="why-blokpakt" aria-label="About Blokpakt" className="grid scroll-mt-32 gap-8 py-16 lg:grid-cols-[1fr_1.65fr] lg:gap-16 lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">The thinking behind the block</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Why Blokpakt?</h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">A simple question started it all: what if neighbors who need similar work could be served together?</p>
              <div className="mt-7 max-w-sm rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary">A direction, not a promise.</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Less travel and better provider economics are hypotheses to test, not guaranteed savings or earnings.</p>
              </div>
            </div>
            <div className="space-y-3">
              {story.map((item, index) => (
                <details key={item.id} open={index === 0} className="group rounded-2xl border border-border bg-card transition-colors open:border-primary/30">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 rounded-2xl p-5 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                    <span className="text-xs font-semibold text-accent">0{index + 1}</span>
                    <span className="flex-1 text-sm sm:text-base">{item.question}</span>
                    <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-primary transition-transform group-open:rotate-90 motion-reduce:transition-none" />
                  </summary>
                  <p className="px-5 pb-6 text-sm leading-relaxed text-muted-foreground sm:pl-14">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section aria-label="Our pilot" className="flex flex-col justify-between gap-8 rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">One neighborhood at a time</p>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">A small start. A local focus.</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/75">Our US pilot starts with private service requests and human review. Coverage, provider availability, price, and timing require manual agreement. No online payments or automatic dispatch.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              <Link to="/join" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                Explore the provider demo <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/book" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">Explore services <ChevronRight size={16} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
