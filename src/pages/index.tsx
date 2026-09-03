import { useState, type ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { Shield, Camera, Clock, Star, MapPin, Award, ChevronRight, ArrowRight } from 'lucide-react';
import { home } from 'virtual:content';


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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const site = 'https://blokpakt.com';
  const title = 'Blokpakt — Your Whole Block Saves Together';
  const description =
    'Blokpakt batches home services by street. More neighbors booking = lower prices for everyone and higher earnings for contractors. Lawn care, gutters, pressure washing & snow removal.';

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
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Blokpakt', url: `${site}/` },
            {
              '@type': 'LocalBusiness',
              '@id': `${site}/#organization`,
              name: 'Blokpakt',
              url: `${site}/`,
              description,
            },
            {
              '@type': 'WebPage',
              '@id': `${site}/#webpage`,
              url: `${site}/`,
              isPartOf: { '@id': `${site}/#website` },
              about: { '@id': `${site}/#organization` },
              datePublished: '2026-09-01',
              dateModified: '2026-09-01',
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
                    Hyper-local home services
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.1] tracking-tight text-foreground mb-5"
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
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder={home.hero.searchPlaceholder}
                      className="flex-1 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                    />
                    <button
                      onClick={() => navigate('/book')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-accent/90 transition-colors whitespace-nowrap"
                    >
                      {home.hero.searchCta}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    No account needed to check availability. Free to browse.
                  </p>
                </motion.div>
              </motion.div>

              {/* Right: street progress mockup — inline rendered for content editability */}
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' as const, delay: 0.2 }}
                className="flex justify-center lg:justify-end"
              >
                <div className="relative w-full max-w-md mx-auto">
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
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Route</p>
                        <h3 className="text-lg font-bold text-foreground mt-0.5">{home.hero.mockup.streetName}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                        {home.hero.mockup.discount} off
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
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
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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
                      <span className="font-semibold text-foreground">Booked: {home.hero.mockup.booked} home</span>
                      {' '}|{' '}
                      <span className="text-accent font-medium">Goal: {home.hero.mockup.goal}+ homes to {home.hero.mockup.label}</span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs text-muted-foreground">Waiting for neighbors</span>
                      </div>
                      <button
                        onClick={() => navigate('/book')}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Share street link →
                      </button>
                    </div>
                  </div>
                  <motion.div
                    className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.4, type: 'spring', stiffness: 300 }}
                  >
                    Unlock group rate
                  </motion.div>
                </div>
              </motion.div>
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

        {/* ── SERVICE SWITCHER ─────────────────────────────────── */}
        <section id="services" className="py-20 lg:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-10"
            >
              <motion.p variants={fadeUp} className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
                Services
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Pick your service. We handle the rest.
              </motion.h2>
            </motion.div>

            {/* Tab row */}
            <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Service categories">
              {home.services.tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === i}
                  onClick={() => setActiveTab(i)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === i
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-foreground/60 hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content — all tabs rendered, visibility driven by activeTab state */}
            {home.services.tabs.map((tab, tabIdx) => (
              <div
                key={tab.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 ${activeTab === tabIdx ? 'block' : 'hidden'}`}
              >
                {/* Tiered price visualizer */}
                <div className="rounded-2xl border border-border bg-card p-8">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
                    {tab.label} — Pricing
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-5 py-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Solo Rate</p>
                        <p className="text-sm text-foreground/70">Just you on the route</p>
                      </div>
                      <p className="text-2xl font-extrabold text-foreground">${tab.soloRate}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 px-5 py-4">
                      <div>
                        <p className="text-xs text-primary font-semibold mb-0.5">Street Batch Rate</p>
                        <p className="text-sm text-foreground/70">2+ neighbors on your block</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-primary">${tab.batchRate}</p>
                        <span className="inline-block mt-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                          Save ${tab.savings}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prices unlock automatically when 2+ homes on your street book the same service window. No coupon codes needed.
                    </p>
                  </div>
                </div>

                {/* Contractor cards */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Available contractors near you
                  </p>
                  {tab.contractors.map((contractor) => (
                    <motion.div
                      key={contractor.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => navigate('/book')}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {contractor.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm">{contractor.name}</p>
                          {contractor.blockCaptain && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                              <Award size={10} />
                              Block Captain
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star size={11} className="fill-accent text-accent" />
                            <span className="font-medium text-foreground">{contractor.rating}</span>
                            <span>({contractor.jobs} jobs)</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={11} />
                            {contractor.proximity}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
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
                Three steps. One street. Everyone saves.
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

        {/* ── SOCIAL PROOF / STATS ─────────────────────────────── */}
        <section id="pricing" className="py-20 lg:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-12"
            >
              <motion.p variants={fadeUp} className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
                By the numbers
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Built for both sides of the street.
              </motion.h2>
            </motion.div>

            {/* Bento grid */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {/* Large card — contractor earnings */}
              <motion.div
                variants={fadeUp}
                className="md:col-span-2 rounded-2xl border border-border bg-primary text-primary-foreground p-8 relative overflow-hidden"
              >
                <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
                  <defs>
                    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
                <div className="relative">
                  <p className="text-sm font-semibold text-primary-foreground/60 uppercase tracking-wide mb-3">
                    Contractor earnings
                  </p>
                  <p className="text-5xl font-extrabold mb-2">{home.stats[0].value}</p>
                  <p className="text-base text-primary-foreground/80 mb-6">{home.stats[0].label}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '4 homes', value: '$720 gross' },
                      { label: '5% fee', value: '−$36' },
                      { label: 'Net payout', value: '$684' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-white/10 px-3 py-2.5">
                        <p className="text-xs text-primary-foreground/60 mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Rating card */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Quality rating
                  </p>
                  <p className="text-5xl font-extrabold text-foreground mb-2">{home.stats[1].value}</p>
                  <p className="text-sm text-muted-foreground">{home.stats[1].label}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border leading-relaxed">
                  {home.stats[1].detail}
                </p>
              </motion.div>

              {/* Dispute card */}
              <motion.div
                variants={fadeUp}
                className="md:col-span-3 rounded-2xl border-2 border-accent/20 bg-accent/5 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div>
                  <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
                    Dispute protection
                  </p>
                  <p className="text-4xl font-extrabold text-foreground mb-1">{home.stats[2].value}</p>
                  <p className="text-sm text-muted-foreground">{home.stats[2].label}</p>
                </div>
                <div className="flex items-start gap-3 max-w-sm">
                  <Shield size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{home.stats[2].detail}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA SECTION ──────────────────────────────────────── */}
        <section id="contractors" className="relative py-20 lg:py-28 bg-primary overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern id="cta-streets" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="10" y="10" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="45" y="10" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="45" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="45" y="45" width="25" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-streets)" />
          </svg>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-foreground mb-4 leading-tight"
              >
                {home.cta.headline}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-primary-foreground/70 mb-8">
                {home.cta.subheadline}
              </motion.p>

              <motion.div variants={fadeUp}>
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    type="text"
                    placeholder={home.cta.searchPlaceholder}
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                    <button
                      onClick={() => navigate('/book')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-accent/90 transition-colors whitespace-nowrap"
                    >
                      {home.cta.searchCta}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <Link
                    to="/join"
                    className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {home.cta.contractorLink}
                  </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
