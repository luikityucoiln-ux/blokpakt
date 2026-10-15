import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import PilotShell, { PilotAccess } from '../components/PilotShell';
import { useAuth } from '../hooks/use-auth';
import { loadRequestCatalog, requestError, requestInput, submitRequest, US_STATES, type RequestInput } from '../lib/service-requests';

const inputClass = 'mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm';

function RequestForm() {
  const { user } = useAuth();
  const catalog = useQuery({ queryKey: ['pilot-catalog', user?.id], queryFn: loadRequestCatalog, gcTime: 0 });
  const key = useRef<string | null>(null);
  const [validation, setValidation] = useState('');
  const submission = useMutation({ mutationFn: (input: RequestInput) => {
    key.current ??= window.crypto.randomUUID();
    return submitRequest(input, key.current);
  }, retry: false });
  if (catalog.isPending) return <p role="status">Checking available services...</p>;
  if (catalog.error) return <div role="alert" className="rounded-xl border border-destructive/30 p-5">
    <p>{requestError(catalog.error)}</p><p className="mt-2 text-sm">Pilot setup may be incomplete. Nothing has been submitted.</p>
    <button onClick={() => void catalog.refetch()} className="mt-3 font-bold text-primary">Retry</button>
  </div>;
  if (submission.data) return <section role="status" className="rounded-2xl border border-primary/20 bg-card p-8">
    <h2 className="text-2xl font-bold">Your request was received</h2>
    <p className="mt-3">This is not yet a confirmed booking. An operator needs to review your address, service, and availability.</p>
    <p className="mt-3 break-all text-sm">Reference: {submission.data.id}</p>
    <p className="mt-2 text-sm text-muted-foreground">We have saved your request online. We have not charged you or sent an automatic booking email.</p>
    <Link to="/requests" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">View my requests</Link>
  </section>;
  if (!catalog.data.open || catalog.data.services.length === 0) return <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xl font-bold">New requests are not open yet</h2>
    <p className="mt-2 text-sm text-muted-foreground">We are preparing the pilot. Existing requests remain available in My requests. No service availability is promised.</p>
    <button onClick={() => void catalog.refetch()} className="mt-4 font-bold text-primary">Check again</button>
  </section>;
  return <form className="rounded-2xl border border-border bg-card p-6 sm:p-8" onSubmit={(event) => {
    event.preventDefault();
    if (submission.isPending) return;
    const values = Object.fromEntries(new window.FormData(event.currentTarget));
    setValidation('');
    const parsed = requestInput.safeParse({ ...values, contact_consent: values.contact_consent === 'on' });
    if (!parsed.success) { setValidation(requestError(parsed.error)); return; }
    submission.mutate(parsed.data);
  }}>
    <fieldset disabled={submission.isPending} className="space-y-5">
      <legend className="mb-5 text-lg font-bold">Tell us what your home needs</legend>
      <label className="block text-sm font-semibold">Service<select required name="service_id" className={inputClass} defaultValue="">
        <option value="" disabled>Choose a service</option>{catalog.data.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
      </select></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Full name<input name="full_name" required maxLength={150} autoComplete="name" className={inputClass} /></label>
        <label className="block text-sm font-semibold">Phone (optional)<input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} /></label>
      </div>
      <p className="break-all text-sm text-muted-foreground">Contact email: {user?.email} (from your verified account)</p>
      <label className="block text-sm font-semibold">Street address<input name="address" required maxLength={300} autoComplete="street-address" className={inputClass} /></label>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block text-sm font-semibold">City<input name="city" required maxLength={100} autoComplete="address-level2" className={inputClass} /></label>
        <label className="block text-sm font-semibold">State / DC<select required name="state_code" autoComplete="address-level1" defaultValue="" className={inputClass}><option value="" disabled>Choose</option>{US_STATES.map((state) => <option key={state}>{state}</option>)}</select></label>
        <label className="block text-sm font-semibold">ZIP code<input name="postal_code" required maxLength={10} autoComplete="postal-code" className={inputClass} /></label>
      </div>
      <label className="block text-sm font-semibold">Preferred availability (optional)<input name="availability" maxLength={300} placeholder="For example: weekday afternoons" className={inputClass} /></label>
      <label className="block text-sm font-semibold">Service details (optional)<textarea name="details" rows={4} maxLength={3000} placeholder="Describe the work and relevant property details. Do not include door codes, passwords, or payment information." className={inputClass} /></label>
      <label className="flex items-start gap-3 text-sm"><input name="contact_consent" required type="checkbox" className="mt-1" /><span>I allow Blokpakt to contact me about this request. I understand this is not a confirmed booking or a payment. See our <Link to="/legal" className="underline">privacy and terms</Link>.</span></label>
      <button className="w-full rounded-xl bg-accent px-5 py-3 font-bold text-white disabled:opacity-50">{submission.isPending ? 'Submitting...' : 'Submit service request'}</button>
    </fieldset>
    {(validation || submission.error) && <div role="alert" className="mt-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
      <p>{validation || requestError(submission.error)}</p>
      <p className="mt-2">If your connection was interrupted, check <Link to="/requests" className="underline">My requests</Link> before trying again. Retrying this unchanged form uses the same submission reference.</p>
    </div>}
  </form>;
}

export default function RequestServicePage() {
  return <PilotShell title="Request a home service"><PilotAccess><RequestForm /></PilotAccess></PilotShell>;
}
