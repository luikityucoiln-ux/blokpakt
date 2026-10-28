import { useState, type ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { Shield, Camera, Clock, ChevronRight, ArrowRight, Users, ClipboardCheck, Wrench, House, Leaf, Droplets, Snowflake, PiggyBank, Download } from 'lucide-react';
import { home } from 'virtual:content';
import FeatureInterestPanel from '../components/FeatureInterestPanel';
import { SERVICES } from '../lib/marketplace-catalog';
import { liveRequestsEnabled } from '../lib/service-requests';


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const trustIcons: Record<string, ReactNode> = {
  shield: <Shield size={18} />,
  camera: <Camera size={18} />,
  clock: <Clock size={18} />,
};

const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Neighbors, Together',
    description: 'Nearby households can request similar work together. Group pricing depends on the service, timing, and provider agreement.',
  },
  {
    icon: ClipboardCheck,
    title: 'Clear Before You Commit',
    description: 'Service area, availability, scope, price, and timing are reviewed manually. A request is not a confirmed booking.',
  },
  {
    icon: Wrench,
    title: 'Independent Local Providers',
    description: 'Blokpakt is building a marketplace for independent home-service professionals. No online payments or automatic dispatch are enabled.',
  },
];

const serviceIcons = { lawn: Leaf, gutter: House, pressure: Droplets, snow: Snowflake };

const PROVIDER_INVITE_CODES: Record<string, string> = {
  'MARCUS-T': 'marcus-t',
  'DEVON-R': 'devon-r',
  'PRIYA-S': 'priya-s',
};

export default function HomePage() {
  const [streetAddress, setStreetAddress] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();

  const site = 'https://blokpakt.com';
  const logoUrl = `${site}/assets/blokpakt-bp-mark.svg`;
  const socialImageUrl = `${site}/assets/og-image.png`;
  const title = 'Blokpakt | Neighborhood home services';
  const description =
    'Explore neighborhood home services with Blokpakt. Our US pilot uses manually reviewed requests, quotes, and scheduling. No online payments.';

  function handleStreetCheck() {
    const address = streetAddress.trim();
    navigate(address ? `/book?address=${encodeURIComponent(address)}` : '/book');
  }

  function handleInviteCode() {
    const code = inviteCode.trim();
    if (!code) return;
    const providerId = PROVIDER_INVITE_CODES[code.toUpperCase()];
    if (providerId) {
      navigate(`/book?provider=${encodeURIComponent(providerId)}`);
      return;
    }
    navigate(`/batch/${encodeURIComponent(code.toUpperCase())}`);
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={site} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site} />
        <meta property="og:image" content={socialImageUrl} />
        <meta property="og:image:alt" content="Blokpakt neighborhood home-services concept" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={socialImageUrl} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Blokpakt', url: `${site}/` },
            {
              '@type': 'Organization',
              '@id': `${site}/#organization`,
              name: 'Blokpakt',
              url: `${site}/`,
              logo: logoUrl,
              image: logoUrl,
              description,
            },
            {
              '@type': 'WebPage',
              '@id': `${site}/#webpage`,
              url: `${site}/`,
              isPartOf: { '@id': `${site}/#website` },
              about: { '@id': `${site}/#organization` },
            },
          ],
        })}</script>
      </Helmet>

      <main>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-background pt-16 pb-20 lg:pt-24 lg:pb-28">
          {/* Street map SVG texture */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern id="streets" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="10" y="10" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="45" y="10" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="45" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="45" y="45" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#streets)" />
          </svg>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: copy + search */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="max-w-xl"
              >
                <motion.div variants={fadeUp}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    US pilot in development
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.1] text-foreground mb-5"
                >
                  {home.hero.headline}
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="text-lg text-muted-foreground leading-relaxed mb-8"
                >
                  {home.hero.subheadline}
                </motion.p>

                {/* Search bar */}
                <motion.div variants={fadeUp} id="check-street">
                  {liveRequestsEnabled ? (
                    <Link to="/request-service" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Request a service <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      <form onSubmit={(event) => { event.preventDefault(); handleStreetCheck(); }} aria-label="Explore a sample street">
                        <label htmlFor="sample-street" className="mb-2 block text-sm font-semibold text-foreground">Example street</label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            id="sample-street"
                            type="text"
                            autoComplete="off"
                            maxLength={150}
                            value={streetAddress}
                            onChange={(event) => setStreetAddress(event.target.value)}
                            placeholder={home.hero.searchPlaceholder}
                            aria-describedby="homepage-status"
                            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            {home.hero.searchCta} <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </form>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-primary">Have a demo invite code?</summary>
                        <form onSubmit={(event) => { event.preventDefault(); handleInviteCode(); }} className="mt-3 flex flex-col gap-2 sm:flex-row" aria-label="Open a demo invitation">
                          <label htmlFor="demo-invite" className="sr-only">Demo invite code</label>
                          <input id="demo-invite" type="text" autoComplete="off" required maxLength={80} value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="e.g. OAK-2024" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <button type="submit" disabled={!inviteCode.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                            Open demo invite <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        </form>
                      </details>
                    </>
                  )}
                  <p id="homepage-status" className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    {liveRequestsEnabled
                      ? 'Requests are reviewed manually. Coverage, provider availability, price, and timing must be agreed before confirmation.'
                      : 'Demo only. Use sample information. No booking, availability check, or payment is made.'}
                  </p>
                  <Link to="/our-story" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
                    Our story <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right: street progress mockup — inline rendered for content editability */}
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' as const, delay: 0.2 }}
                className="flex justify-center lg:justify-end"
              >
                <div className="relative w-full min-w-0 max-w-md mx-auto">
                  <div className="rounded-2xl bg-card border border-border shadow-2xl p-6 relative overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" aria-hidden="true">
                      <defs>
                        <pattern id="mockup-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#mockup-grid)" />
                    </svg>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Neighborhood example</p>
                        <h3 className="text-lg font-bold text-foreground mt-0.5">{home.hero.mockup.streetName}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                        Sample route
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3" aria-hidden="true">
                      {Array.from({ length: home.hero.mockup.goal + 1 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all ${
                            i < home.hero.mockup.booked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : i === home.hero.mockup.booked
                              ? 'bg-accent/10 border-accent border-dashed text-accent'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          <House size={16} />
                        </div>
                      ))}
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(home.hero.mockup.booked / home.hero.mockup.goal) * 100}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' as const, delay: 0.4 }}
                      />
                    </div>
                    <p className="text-sm text-foreground/70">
                      <span className="font-semibold text-foreground">{home.hero.mockup.booked} interested household</span>
                      {' '}|{' '}
                      <span className="text-accent font-medium">{home.hero.mockup.goal}+ homes to explore grouping</span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs text-muted-foreground">Illustrative, not a live request</span>
                      </div>
                      <Link to="/our-story" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
                        The idea <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Group pricing is subject to provider agreement. No fixed savings are guaranteed.</p>
                  </div>
                  <motion.div
                    className="absolute -top-3 right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.4, type: 'spring', stiffness: 300 }}
                  >
                    Closer together
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 border-y border-border bg-card py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-accent">Around the house</p>
                <h2 id="services-heading" className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">What does your home need?</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{liveRequestsEnabled ? 'Available services and coverage are reviewed during your request.' : 'Explore sample services. Prices and providers in the demo are illustrative.'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((service) => {
                const Icon = serviceIcons[service.id as keyof typeof serviceIcons];
                return (
                  <Link key={service.id} to={liveRequestsEnabled ? '/request-service' : `/book?service=${service.id}`} className="group flex min-w-0 flex-col rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={23} aria-hidden="true" /></span>
                      <ArrowRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{service.label}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                    <span className="mt-5 text-xs font-semibold text-primary">{liveRequestsEnabled ? 'Request service' : 'Explore demo'}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── VALUE PROPS ──────────────────────────────────────── */}
        <section className="bg-muted/30 py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {VALUE_PROPS.map((valueProp) => (
                <article key={valueProp.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <valueProp.icon size={28} className="text-primary" aria-hidden="true" />
                  <h2 className="mt-5 text-lg font-bold text-foreground">{valueProp.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{valueProp.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST SIGNALS ────────────────────────────────────── */}
        <section className="border-y border-border bg-muted/40 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {home.trustSignals.map((signal) => (
                <div key={signal.id} className="flex items-start gap-3 py-2">
                  <span className="mt-0.5 flex-shrink-0 text-primary">
                    {trustIcons[signal.icon]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{signal.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-14"
            >
              <motion.p variants={fadeUp} className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
                How it works
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground max-w-lg">
                A little planning. A closer neighborhood.
              </motion.h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            >
              {home.howItWorks.steps.map((step, i) => (
                <motion.div key={step.id} variants={fadeUp} className="relative">
                  {i < home.howItWorks.steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                  )}
                  <div className="relative z-10">
                    <p className="text-6xl font-extrabold text-primary/10 leading-none mb-4 select-none">
                      {step.number}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mb-12">
              <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wide text-accent">{home.trustAndSafety.eyebrow}</motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-extrabold sm:text-4xl">{home.trustAndSafety.headline}</motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-base leading-relaxed text-primary-foreground/70">{home.trustAndSafety.intro}</motion.p>
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {home.trustAndSafety.items.map((item) => (
                <div key={item.id} className="border-l border-white/20 pl-5">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/65">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-white/15 pt-6">
              <h3 className="font-bold">{home.trustAndSafety.reporting.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-primary-foreground/65">{home.trustAndSafety.reporting.description}</p>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{home.bookingFaq.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">{home.bookingFaq.headline}</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {home.bookingFaq.items.slice(0, 3).map((item) => (
                <details key={item.id} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-bold text-foreground">
                    {item.question}
                    <ChevronRight size={18} className="shrink-0 text-accent transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 max-w-3xl pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/faq" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent">
                View all FAQs <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pilot-heading" className="border-t border-border bg-background py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <figure className="min-w-0">
                <img src="/assets/og-image.png" alt="Illustrated Blokpakt neighborhood concept" width={1200} height={630} loading="lazy" className="aspect-[1200/630] w-full rounded-lg border border-border object-contain" />
                <figcaption className="mt-2 text-xs text-muted-foreground">Concept illustration, not a live route or service area.</figcaption>
              </figure>
              <div>
                <p className="text-sm font-semibold text-accent">For both sides of the street</p>
                <h2 id="pilot-heading" className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Local work. Thoughtfully coordinated.</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">We are preparing a manually operated US pilot. Coverage and providers are not yet established. Every service needs an agreed scope, quote, and date before it is confirmed.</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">No subscriptions, online payments, automatic dispatch, or guaranteed discounts.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={liveRequestsEnabled ? '/request-service' : '/book'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    {liveRequestsEnabled ? 'Request a service' : 'Explore the service demo'} <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/join" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    Explore the provider demo <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="home-planner-heading" className="border-t border-border bg-[#eaf2e8] py-14 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-bold text-primary">
                <PiggyBank size={20} className="text-accent" aria-hidden="true" /> A free little tool for home life
              </span>
              <h2 id="home-planner-heading" className="text-3xl font-extrabold text-primary sm:text-4xl">Small spends. A bigger picture.</h2>
              <p className="mt-4 text-base leading-relaxed text-primary/80">See the working time behind everyday expenses. Keep a quick ledger, plan a safety cushion, and make a little more room for home.</p>
              <p className="mt-3 text-sm leading-relaxed text-primary/75">No sign-up or bank connection. Your figures stay in your browser. Download a single HTML file to use offline; examples are clearly marked. Planning estimates, not service quotes or guaranteed savings.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href="/home-planner.html" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Open the free home planner <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href="/home-planner.html" download="blokpakt-home-planner.html" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-background px-6 py-3 text-sm font-bold text-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Download size={18} aria-hidden="true" /> Download for offline use
              </a>
            </div>
          </div>
        </section>

        <FeatureInterestPanel />
      </main>
    </>
  );
}
