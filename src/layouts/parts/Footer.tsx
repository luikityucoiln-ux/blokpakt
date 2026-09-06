export default function Footer() {
  return (
    <footer className="bg-footer text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img
              src="/airo-assets/images/logo/horizontal/dark"
              alt="Blokpakt"
              className="block h-auto max-h-9 w-auto max-w-[160px] object-contain mb-4"
            />
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Your whole block saves. Your contractor earns more. Hyper-local home services, powered by neighborhood density.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Services</h3>
            <ul className="space-y-2">
              {['Lawn Care', 'Gutter Cleaning', 'Pressure Washing', 'Snow Removal'].map((s) => (
                <li key={s}>
                  <a href="#services" className="text-sm text-white/70 hover:text-white transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Company</h3>
            <ul className="space-y-2">
              {[
                { label: 'About', href: '#' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQs', href: '/faq' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contractors */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">For Contractors</h3>
            <ul className="space-y-2">
              {[
                { label: 'Join the Network', href: '/join' },
                { label: 'Field App', href: '/field' },
                { label: 'Payouts', href: '/field' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">© 2026 Blokpakt. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-end">
            {[
              { label: 'Legal Center', href: '/legal' },
              { label: 'Privacy', href: '/legal#privacy' },
              { label: 'State Privacy & Retention', href: '/legal#state-privacy-retention' },
              { label: 'Cookies', href: '/legal#cookies' },
              { label: 'Ad Choices', href: '/legal#ad-choices' },
              { label: 'Terms', href: '/legal#terms' },
              { label: 'IP Notice', href: '/legal#intellectual-property' },
              { label: 'Property Access & Photos', href: '/legal#property-access-photos' },
              { label: 'Scope Changes & Add-ons', href: '/legal#scope-changes-add-ons' },
              { label: 'Platform Rules', href: '/legal#platform-rules' },
            ].map((link) => (
              <a key={link.label} href={link.href} className="text-xs text-white/40 hover:text-white/70 transition-colors">{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
