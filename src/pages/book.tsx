import { useEffect, useRef, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, ArrowLeft, Shield, Clock, Camera, CheckCircle, LocateFixed, CalendarDays } from 'lucide-react';
import { savePendingBooking, clearPendingBooking } from '../lib/pending-booking';

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

const PROVIDERS = [
  { id: 'marcus-t', name: 'Marcus T.', services: ['lawn', 'gutter', 'pressure', 'snow'] },
  { id: 'devon-r', name: 'Devon R.', services: ['lawn', 'gutter', 'pressure', 'snow'] },
  { id: 'priya-s', name: 'Priya S.', services: ['lawn', 'gutter', 'pressure', 'snow'] },
];

interface BookingForm {
  serviceId: string;
  providerId: string;
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
  providerId: '',
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

const SERVICE_WINDOW_OPTIONS = [
  { id: 'morning', label: 'Morning', window: '8am–12pm', description: '8am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', window: '12pm–4pm', description: '12pm – 4pm' },
  { id: 'flexible', label: 'Flexible / Any Time', window: '8am–5pm', description: '8am – 5pm', discountCents: 200 },
] as const;

const FLEXIBLE_DISCOUNT_CENTS = 200;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBookingDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function availableBookingDates(): Date[] {
  return Array.from({ length: 14 }, (_, index) => addDays(new Date(), index + 7));
}

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

function getInvitedProviderId(): string | null {
  if (typeof window === 'undefined') return null;
  const providerId = new window.URLSearchParams(window.location.search).get('provider');
  return PROVIDERS.some((provider) => provider.id === providerId) ? providerId : null;
}

function getInitialForm(): BookingForm {
  if (typeof window === 'undefined') return DEMO_DEFAULTS;
  const params = new window.URLSearchParams(window.location.search);
  const address = params.get('address');
  const batchCode = params.get('batch');
  const serviceId = params.get('service');
  const selectedService = SERVICES.some((service) => service.id === serviceId) ? serviceId : null;
  const invitedProviderId = getInvitedProviderId();
  return {
    ...DEMO_DEFAULTS,
    ...(address ? parseAddress(address) : {}),
    ...(batchCode ? { referralCode: batchCode.toUpperCase() } : {}),
    ...(selectedService ? { serviceId: selectedService } : {}),
    ...(invitedProviderId ? { providerId: invitedProviderId } : {}),
  };
}

function getInitialStep(): number {
  if (typeof window === 'undefined') return 1;
  const serviceId = new window.URLSearchParams(window.location.search).get('service');
  return SERVICES.some((service) => service.id === serviceId) ? 2 : 1;
}

const fadeSlide = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

export default function BookPage() {
  const [step, setStep] = useState(getInitialStep);
  const [form, setForm] = useState<BookingForm>(getInitialForm);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | null>(null);
  const [confirmedSchedule, setConfirmedSchedule] = useState<{ date: string; windowId: string } | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  const selectedService = SERVICES.find((s) => s.id === form.serviceId) ?? SERVICES[0];
  const invitedProviderId = getInvitedProviderId();
  const availableProviders = PROVIDERS
    .filter((provider) => provider.services.includes(form.serviceId))
    .sort((first, second) => Number(second.id === invitedProviderId) - Number(first.id === invitedProviderId));
  const selectedProvider = availableProviders.find((provider) => provider.id === form.providerId);
  const selectedWindow = SERVICE_WINDOW_OPTIONS.find((option) => form.preferredSlot.endsWith(` · ${option.window}`));
  const confirmedWindow = SERVICE_WINDOW_OPTIONS.find((option) => option.id === confirmedSchedule?.windowId);
  const flexibleDiscountCents = confirmedWindow?.id === 'flexible' ? FLEXIBLE_DISCOUNT_CENTS : 0;
  const orderTotalCents = Math.round(selectedService.batchPrice * 100) - flexibleDiscountCents;
  const minimumBookingDate = addDays(new Date(), 7);
  const maximumBookingDate = addDays(new Date(), 90);

  function update(field: keyof BookingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectBookingDate(date: Date) {
    if (date < minimumBookingDate || date > maximumBookingDate) return;
    setConfirmedSchedule(null);
    setSelectedBookingDate(date);
    if (form.preferredSlot) {
      const timeWindow = form.preferredSlot.split(' · ').at(-1) ?? '';
      update('preferredSlot', `${formatBookingDate(date)} · ${timeWindow}`);
    }
  }

  function selectServiceWindow(timeWindow: string) {
    if (!selectedBookingDate) return;
    setConfirmedSchedule(null);
    update('preferredSlot', `${formatBookingDate(selectedBookingDate)} · ${timeWindow}`);
  }

  function confirmSchedule() {
    if (!selectedBookingDate || !selectedWindow) return;
    setConfirmedSchedule({ date: dateKey(selectedBookingDate), windowId: selectedWindow.id });
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

  async function handleCheckout() {
    setCheckoutError('');

    if (!selectedBookingDate || !selectedWindow || !confirmedSchedule || selectedBookingDate < minimumBookingDate || selectedBookingDate > maximumBookingDate) {
      setCheckoutError('Please select a valid date and service window before continuing.');
      return;
    }

    setLoading(true);

    // Stash the booking details so the confirmation screen can create a local demo job.
    const jobCode = `BLK-${Date.now().toString(36).toUpperCase()}`;
    savePendingBooking({
      jobCode,
      service: selectedService.label,
      serviceIcon: selectedService.icon,
      payoutCents: orderTotalCents,
      address: form.address,
      city: form.city,
      zip: form.zip,
      gateCode: form.gateCode,
      propertyNotes: form.propertyNotes,
      scheduledWindow: form.preferredSlot,
      customerName: `${form.firstName} ${form.lastName}`.trim(),
      customerEmail: form.email,
      customerPhone: form.phone,
      batchCode: form.referralCode ? form.referralCode.toUpperCase() : null,
      providerName: selectedProvider?.name ?? 'Provider pending confirmation',
    });

    window.location.assign('/checkout/success');
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

      <main className="min-h-screen bg-muted/30 py-6 lg:py-10">
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

                  <div className="mt-8 border-t border-border pt-7">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-foreground">Choose your provider</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Select the provider you prefer for this service.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableProviders.map((provider) => {
                        const selected = form.providerId === provider.id;
                        const invited = provider.id === invitedProviderId;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => update('providerId', provider.id)}
                            className={`rounded-xl border-2 p-4 text-left transition-colors ${
                              selected
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-background hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {provider.name.split(' ').map((part) => part[0]).join('')}
                              </span>
                              <span>
                                <span className="block text-sm font-bold text-foreground">{provider.name}</span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">Available for {selectedService.label.toLowerCase()}</span>
                                {invited && (
                                  <span className="mt-2 inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                                    Invited you
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedProvider}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                      <div className="w-full rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <CalendarDays size={14} className="text-primary" />
                          Choose a date
                        </div>
                        <p className="mb-2 text-[11px] leading-4 text-muted-foreground">
                          Bookings start 7 days out so your neighborhood has time to batch together and save.
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
                          {availableBookingDates().map((date) => {
                            const selected = selectedBookingDate ? dateKey(selectedBookingDate) === dateKey(date) : false;
                            return (
                              <button
                                key={dateKey(date)}
                                type="button"
                                onClick={() => selectBookingDate(date)}
                                className={`flex min-h-[76px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-colors ${
                                  selected
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-xl font-extrabold leading-6">{date.getDate()}</span>
                                <span className="text-[11px] font-semibold opacity-70">
                                  {date.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3 border-t border-border pt-3">
                          <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Choose a time window</p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            {SERVICE_WINDOW_OPTIONS.map((option) => {
                              const selected = selectedWindow?.id === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  disabled={!selectedBookingDate}
                                  onClick={() => selectServiceWindow(option.window)}
                                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                    selected
                                      ? option.id === 'flexible'
                                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-sm'
                                        : 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 text-sm font-bold">
                                    <Clock size={14} /> {option.label}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                                  {option.id === 'flexible' && (
                                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                      Save an extra $2
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            disabled={!selectedBookingDate || !selectedWindow}
                            onClick={confirmSchedule}
                            className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              confirmedSchedule
                                ? 'bg-primary/10 text-primary'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                          >
                            {confirmedSchedule ? 'Date & Time Confirmed' : 'Confirm Date & Time'}
                          </button>
                        </div>
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
                  <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Order summary</p>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{selectedService.label} — Street Batch</span>
                      <span className="font-bold text-foreground">${selectedService.batchPrice}.00</span>
                    </div>
                    {flexibleDiscountCents > 0 && (
                      <div className="flex items-center justify-between text-sm mb-1.5 text-primary">
                        <span>Flexible Slot Discount</span>
                        <span className="font-bold">-$2.00</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm mb-1.5">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-extrabold text-foreground">${(orderTotalCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{form.address ? `${form.address}, ${form.city}` : '247 Oak Street, Springfield'}</span>
                      <span className="text-accent font-semibold">Save ${selectedService.soloPrice - selectedService.batchPrice} vs solo</span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield size={12} className="text-primary flex-shrink-0" />
                      Card authorized now — captured only after photo-verified completion
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                    <button
                      disabled={loading || !confirmedSchedule}
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
                  {checkoutError && (
                    <p className="mt-3 text-right text-xs font-medium text-destructive">{checkoutError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Trust footer */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Shield size={16} />, label: 'UI demo', detail: 'No payment is collected in this prototype' },
              { icon: <Camera size={16} />, label: 'Photo verified', detail: 'Before and after photos are part of the service flow' },
              { icon: <Clock size={16} />, label: '48-hr dispute window', detail: 'Flag an issue for the demo support flow' },
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
