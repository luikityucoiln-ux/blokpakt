import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ShoppingCart, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/use-cart';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const { cartCount } = useCart();
  const location = useLocation();

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Services', href: '/#services' },
    { label: 'Track Job', href: '/track' },
    { label: 'Join as Provider', href: '/join' },
  ];

  // Demo portal links — all prototype pages
  const demoLinks = [
    { label: '🏠 Homepage', href: '/' },
    { label: '📋 Book a Service', href: '/book' },
    { label: '🛒 Cart', href: '/cart' },
    { label: '✅ Booking Confirmed', href: '/checkout/success?session_id=demo_session_blokpakt' },
    { label: '📍 Track My Job', href: '/track' },
    { label: '🔧 Join as Provider', href: '/join' },
    { label: '📱 Provider Field App', href: '/field' },
    { label: '⚙️ Admin Dashboard', href: '/admin' },
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
                Jump to page <ChevronDown size={12} className={`transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
              </button>
              {demoOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5 overflow-hidden">
                  {demoLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setDemoOpen(false)}
                      className={`block px-4 py-2 text-xs font-medium transition-colors ${
                        location.pathname === link.href.split('?')[0]
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {link.label}
                    </Link>
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
              src="/airo-assets/images/logo/horizontal"
              alt="Blokpakt"
              className="block h-auto max-h-9 w-auto max-w-[160px] object-contain"
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
              to="/cart"
              className="relative p-2 text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
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
            <p className="text-xs font-semibold text-muted-foreground px-0 py-1">Demo pages</p>
            {demoLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block text-xs font-medium text-foreground/60 hover:text-foreground py-1.5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
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
