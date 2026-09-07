import { book } from 'virtual:content';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft, Shield, Clock, Camera, CheckCircle, ChevronDown, LocateFixed } from 'lucide-react';

interface GoogleAutocompletePlace {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
}

interface GoogleAutocomplete {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => GoogleAutocompletePlace;
  setBounds: (bounds: GoogleLatLngBounds) => void;
}

interface GoogleLatLngBounds {
  extend: (point: { lat: number; lng: number }) => void;
}

interface GoogleMapsApi {
  maps: {
    places: { Autocomplete: new (input: HTMLInputElement, options: { types: string[] }) => GoogleAutocomplete };
    LatLngBounds: new () => GoogleLatLngBounds;
  };
}

interface GoogleMapsScript {
  src: string;
  async: boolean;
  defer: boolean;
  dataset: { googlePlaces?: string };
  addEventListener: (eventName: string, handler: () => void) => void;
  removeEventListener: (eventName: string, handler: () => void) => void;
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

// ── Stripe product IDs ────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: 'lawn',
    label: 'Lawn Care',
    description: 'Mowing, edging, and cleanup',
    batchPrice: 45,
    soloPrice: 50,
    priceId: 'price_1UAu4SEJF8FW6JeNvwIUueOx',
    icon: '🌿',
  },
  {
    id: 'gutter',
    label: 'Gutter Cleaning',
    description: 'Full flush, downspout clear, debris removal',
    batchPrice: 162,
    soloPrice: 180,
    priceId: 'price_1UAu4XEJF8FW6JeNIwausphW',
    icon: '🏠',
  },
  {
    id: 'pressure',
    label: 'Pressure Washing',
    description: 'Driveway, walkway, and exterior surfaces',
    batchPrice: 198,
    soloPrice: 220,
    priceId: 'price_1UAu4dEJF8FW6JeNLy1JKH22',
    icon: '💧',
  },
  {
    id: 'snow',
    label: 'Snow Removal',
    description: 'Driveway and walkway clearing with salt',
    batchPrice: 58,
    soloPrice: 64,
    priceId: 'price_1UAu4fEJF8FW6JeNddVHVpel',
    icon: '❄️',
  },
];

interface BookingForm {
  serviceId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyNotes: string;
  gateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredSlot: string;
  referralCode: string;
}

// Demo defaults — pre-fill so the prototype flows without typing
const DEMO_DEFAULTS: BookingForm = {
  serviceId: 'lawn',
  address: '247 Oak Street',
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  propertyNotes: '',
  gateCode: '',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex@example.com',
  phone: '(312) 555-0100',
  preferredSlot: '',
  referralCode: '',
};

function parseAddress(value: string): Pick<BookingForm, 'address' | 'city' | 'state' | 'zip'> {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  const lastPart = parts.at(-1) ?? '';
  const stateZipMatch = lastPart.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  if (parts.length >= 3 && stateZipMatch) {
    return {
      address: parts.slice(0, -2).join(', '),
      city: parts.at(-2) ?? '',
      state: stateZipMatch[1].toUpperCase(),
      zip: stateZipMatch[2],
    };
  }

  return { address: value, city: '', state: '', zip: '' };
}

function getInitialForm(): BookingForm {
  if (typeof window === 'undefined') return DEMO_DEFAULTS;
  const params = new window.URLSearchParams(window.location.search);
  const address = params.get('address');
  const batchCode = params.get('batch');
  return {
    ...DEMO_DEFAULTS,
    ...(address ? parseAddress(address) : {}),
    ...(batchCode ? { referralCode: batchCode.toUpperCase() } : {}),
  };
}

const fadeSlide = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

export default function BookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(getInitialForm);
  const [loading, setLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  const selectedService = SERVICES.find((s) => s.id === form.serviceId) ?? SERVICES[0];

  function update(field: keyof BookingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !addressInputRef.current) return;

    const attachAutocomplete = () => {
      if (!window.google?.maps?.places || !addressInputRef.current || autocompleteRef.current) return;
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const components = place.address_components ?? [];
        const getComponent = (type: string) => components.find((component) => component.types.includes(type));
        const streetNumber = getComponent('street_number')?.long_name ?? '';
        const route = getComponent('route')?.long_name ?? '';
        const city = getComponent('locality')?.long_name ?? getComponent('postal_town')?.long_name ?? '';
        const state = getComponent('administrative_area_level_1')?.short_name ?? '';
        const zip = getComponent('postal_code')?.long_name ?? '';
        setForm((previous) => ({
          ...previous,
          address: [streetNumber, route].filter(Boolean).join(' ') || previous.address,
          city: city || previous.city,
          state: state || previous.state,
          zip: zip || previous.zip,
        }));
      });
      if (locationRef.current) applyLocationBounds(locationRef.current, autocomplete);
    };

    if (window.google?.maps?.places) {
      attachAutocomplete();
      return;
    }

    const existingScript = document.querySelector('script[data-google-places]');
    const script = (existingScript ?? document.createElement('script')) as unknown as GoogleMapsScript;
    if (!existingScript) {
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlaces = 'true';
      document.head.appendChild(script as unknown as ReturnType<typeof document.createElement>);
    }
    script.addEventListener('load', attachAutocomplete);
    return () => script.removeEventListener('load', attachAutocomplete);
  }, []);

  function applyLocationBounds(location: { lat: number; lng: number }, autocomplete = autocompleteRef.current) {
    if (!autocomplete || !window.google?.maps?.LatLngBounds) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(location);
    autocomplete.setBounds(bounds);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser.');
      return;
    }
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        locationRef.current = location;
        applyLocationBounds(location);
        setLocationMessage('Search results are now biased near you. Confirm your exact address.');
      },
      () => setLocationMessage('We could not access your location. You can enter the address manually.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  // DEMO MODE: no validation — navigate directly to success
  function handleCheckout() {
    setLoading(true);
    window.setTimeout(() => {
      navigate('/checkout/success?demo=1&session_id=demo_session_blokpakt');
    }, 900);
  }

  const stepLabels = ['Service', 'Property', 'Contact & Schedule'];

  return (
    <>
      <Helmet>
        <title>Book a Service — Blokpakt</title>
        <meta
          name="description"
          content="Book lawn care, gutter cleaning, pressure washing, or snow removal on Blokpakt. Your card is held on authorization — never charged until the job is done."
        />
        <link rel="canonical" href="https://blokpakt.com/book" />
        <meta property="og:title" content="Book a Service — Blokpakt" />
        <meta
          property="og:description"
          content="Book lawn care, gutter cleaning, pressure washing, or snow removal on Blokpakt."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blokpakt.com/book" />
        <meta
          property="og:image"
          content="https://blokpakt.com/og-book.svg"
        />
        <meta property="og:image:alt" content="Blokpakt" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book a Service — Blokpakt" />
        <meta
          name="twitter:description"
          content="Book lawn care, gutter cleaning, pressure washing, or snow removal on Blokpakt."
        />
        <meta
          name="twitter:image"
          content="https://blokpakt.com/og-book.svg"
        />
      </Helmet>

      <main className="min-h-screen bg-muted/30 py-12 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Demo banner */}
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            Demo mode — fields pre-filled. Click through any step to proceed.
          </div>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Have questions before booking? <Link to="/faq" className="font-semibold text-primary hover:text-accent">Read the FAQ</Link>
          </p>

          {/* Page header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
              Book your service
            </h1>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Card held on authorization — only charged after photo-verified completion.
            </p>
          </div>

          {/* Step progress — clickable in demo mode */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const done = step > num;
              const active = step === num;
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setStep(num)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : active
                          ? 'bg-accent text-white'
                          : 'bg-muted text-muted-foreground border border-border hover:border-primary/40'
                      }`}
                    >
                      {done ? <CheckCircle size={16} /> : num}
                    </button>
                    <span
                      className={`mt-1.5 text-xs font-medium hidden sm:block ${
                        active ? 'text-accent' : done ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={`w-16 sm:w-24 h-px mx-2 mb-4 transition-all ${
                        step > num ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Main card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Service selection ─────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={fadeSlide}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 sm:p-10"
                >
                  <h2 className="text-xl font-bold text-foreground mb-1">Choose your service</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Batch pricing unlocks automatically when 2+ homes on your street book the same window.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SERVICES.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => update('serviceId', svc.id)}
                        className={`text-left rounded-xl border-2 p-5 transition-all ${
                          form.serviceId === svc.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-foreground">{svc.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                          </div>
                          <span className="text-2xl">{svc.icon}</span>
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Batch rate</p>
                            <p className="text-xl font-extrabold text-primary">${svc.batchPrice}</p>
                          </div>
                          <div className="text-muted-foreground/50 text-sm pb-0.5">vs</div>
                          <div>
                            <p className="text-xs text-muted-foreground">Solo rate</p>
                            <p className="text-sm font-semibold text-muted-foreground line-through">${svc.soloPrice}</p>
                          </div>
                          <span className="ml-auto inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                            Save ${svc.soloPrice - svc.batchPrice}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
                    >
                      Next: Property details
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Property details ──────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={fadeSlide}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 sm:p-10"
                >
                  <h2 className="text-xl font-bold text-foreground mb-1">Property details</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your contractor needs this to find and access your property.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Street address</label>
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          value={form.address}
                          onChange={(e) => update('address', e.target.value)}
                          placeholder="123 Oak Street"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={handleLocateMe}
                          aria-label="Use current location to bias address search"
                          title="Use current location"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <LocateFixed size={17} />
                        </button>
                      </div>
                      {locationMessage && <p className="mt-1.5 text-xs text-muted-foreground" role="status">{locationMessage}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        placeholder="Springfield"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">State</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => update('state', e.target.value)}
                          placeholder="IL"
                          maxLength={2}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">ZIP</label>
                        <input
                          type="text"
                          value={form.zip}
                          onChange={(e) => update('zip', e.target.value)}
                          placeholder="62701"
                          maxLength={5}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Gate / access code
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.gateCode}
                        onChange={(e) => update('gateCode', e.target.value)}
                        placeholder="e.g. #1234"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Property notes
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        maxLength={150}
                        value={form.propertyNotes}
                        onChange={(e) => update('propertyNotes', e.target.value)}
                        placeholder="e.g. Dog in backyard, skip side gate"
                        className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
                    >
                      Next: Contact & schedule
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Contact + schedule ────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={fadeSlide}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 sm:p-10"
                >
                  <h2 className="text-xl font-bold text-foreground mb-1">Contact & schedule</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    We'll send your booking confirmation and contractor details here.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">First name</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        placeholder="Alex"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Last name</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        placeholder="Johnson"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Preferred service window
                      </label>
                      <div className="relative">
                        <select
                          value={form.preferredSlot}
                          onChange={(e) => update('preferredSlot', e.target.value)}
                          className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                        >
                          <option value="">Select a time window…</option>
                          {book.TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Referral / neighbor code
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.referralCode}
                        onChange={(e) => update('referralCode', e.target.value)}
                        placeholder="e.g. OAK-2024"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
                    <p className="text-sm font-semibold text-foreground mb-3">Order summary</p>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{selectedService.label} — Street Batch</span>
                      <span className="font-bold text-foreground">${selectedService.batchPrice}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{form.address ? `${form.address}, ${form.city}` : '247 Oak Street, Springfield'}</span>
                      <span className="text-accent font-semibold">Save ${selectedService.soloPrice - selectedService.batchPrice} vs solo</span>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield size={12} className="text-primary flex-shrink-0" />
                      Card authorized now — captured only after photo-verified completion
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                    <button
                      disabled={loading}
                      onClick={handleCheckout}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 hover:bg-primary/90 transition-colors"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>Authorize & book <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Trust footer */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Shield size={16} />, label: 'Stripe-secured', detail: 'Auth hold only — no charge until done' },
              { icon: <Camera size={16} />, label: 'Photo verified', detail: 'Before & after required to release payment' },
              { icon: <Clock size={16} />, label: '48-hr dispute window', detail: 'Flag any issue to freeze capture instantly' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl bg-card border border-border px-4 py-3">
                <span className="text-primary mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
