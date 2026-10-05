import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const location = useLocation();

  if (location.pathname === '/field') return null;

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Services', href: '/book' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Track Job', href: '/track' },
    { label: 'Join as Provider', href: '/join' },
  ];

  const sitemapGroups = [
    {
      label: '🛍️ Customer Flow',
      links: [
        { label: '🏠 Homepage', href: '/' },
        { label: '📋 Services', href: '/completed' },
        { label: '📅 Book a Service', href: '/book' },
        { label: '🚚 Active Batch', href: '/batch/MAPLE-2026' },
        { label: '✅ Booking Confirmed', href: '/checkout/success?session_id=demo_session_blokpakt' },
        { label: '↩️ Booking Cancelled', href: '/checkout/cancel' },
        { label: '📍 Track Job', href: '/track' },
      ],
    },
    {
      label: '👷 Provider & Operations',
      links: [
        { label: '🤝 Join as Provider', href: '/join' },
        { label: '📱 Field Dispatch', href: '/field' },
        { label: '⚙️ Admin Dashboard', href: '/admin' },
      ],
    },
    {
      label: '📚 Reference Pages',
      links: [
        { label: '📦 Products', href: '/products' },
        { label: '❓ FAQs', href: '/faq' },
        { label: '⚖️ Legal', href: '/legal' },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Demo navigation bar */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Interactive prototype
            </span>
            <div className="relative">
              <button
                onClick={() => setDemoOpen(!demoOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
              >
                Master sitemap <ChevronDown size={12} className={`transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
              </button>
              {demoOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-card py-2 shadow-xl">
                  {sitemapGroups.map((group) => (
                    <div key={group.label} className="py-1">
                      <p className="px-4 pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setDemoOpen(false)}
                          className={`block px-4 py-2 text-xs font-medium transition-colors ${
                            location.pathname === link.href.split('?')[0] ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/blokpakt-logo.svg"
              alt="Blokpakt"
              className="block h-8 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith('/') && !link.href.startsWith('/#') ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md text-foreground/70 hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          {navLinks.map((link) =>
            link.href.startsWith('/') && !link.href.startsWith('/#') ? (
              <Link
                key={link.label}
                to={link.href}
                className="block text-sm font-medium text-foreground/70 hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm font-medium text-foreground/70 hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            )
          )}
          <div className="pt-2 border-t border-border mt-2 space-y-1">
            {sitemapGroups.map((group) => (
              <div key={group.label} className="py-1">
                <p className="py-1 text-xs font-semibold text-muted-foreground">{group.label}</p>
                {group.links.map((link) => (
                  <Link key={link.href} to={link.href} className="block py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <Link
            to="/book"
            className="block w-full text-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white mt-3"
            onClick={() => setMobileOpen(false)}
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}
