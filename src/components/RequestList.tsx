import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import {
  cancelRequest, listRequests, loadRequestCounts, nextRequestStatuses,
  REQUEST_PAGE_SIZE, requestError, requestStatus, requestStatuses, updateRequest,
  type RequestStatus, type ServiceRequest, type RequestUpdate,
} from '../lib/service-requests';

const fieldClass = 'mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm';

function OperatorUpdate({ request, onSaved }: { request: ServiceRequest; onSaved: () => void }) {
  const choices = nextRequestStatuses[request.status];
  const [status, setStatus] = useState<RequestStatus>(choices[0] ?? request.status);
  const [note, setNote] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState('');
  const [agreed, setAgreed] = useState(false);
  const mutation = useMutation({ mutationFn: (input: RequestUpdate) => updateRequest(input), onSuccess: onSaved, retry: false });
  if (!choices.length) return null;
  return <form className="mt-5 border-t border-border pt-5" onSubmit={(event) => {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate({ request, status, note, total, date, agreed });
  }}>
    <fieldset disabled={mutation.isPending} className="space-y-4">
      <legend className="mb-3 text-sm font-bold">Operator action</legend>
      <label className="block text-sm">Next status<select className={fieldClass} value={status} onChange={(event) => setStatus(requestStatus.parse(event.target.value))}>{choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
      <label className="block text-sm">Update visible to the customer<textarea required maxLength={1000} className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain the next step and how the customer can contact you. Do not put internal notes here." /></label>
      {status === 'confirmed' && <>
        <label className="block text-sm">Agreed total (USD, not a charge)<input required inputMode="decimal" className={fieldClass} value={total} onChange={(event) => setTotal(event.target.value)} /></label>
        <label className="block text-sm">Agreed service date<input required type="date" min={new Date().toISOString().slice(0, 10)} className={fieldClass} value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="flex items-start gap-3 text-sm"><input required type="checkbox" className="mt-1" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />I have checked coverage and provider availability, and the customer has agreed to this USD quote and date outside the app.</label>
      </>}
      {status === 'completed' && <p className="text-sm text-muted-foreground">Mark completed only after verifying the real work is finished. This does not create photos or issue a payment.</p>}
      <button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{mutation.isPending ? 'Saving...' : 'Save customer update'}</button>
    </fieldset>
    {mutation.error && <p role="alert" className="mt-3 text-sm text-destructive">{requestError(mutation.error)}</p>}
  </form>;
}

function RequestCard({ request, operator, onSaved }: { request: ServiceRequest; operator: boolean; onSaved: () => void }) {
  const cancel = useMutation({ mutationFn: () => cancelRequest(request), onSuccess: onSaved, retry: false });
  return <article className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{request.service_id} service request</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">{request.status}</span></div>
    <p className="mt-2 break-all text-xs text-muted-foreground">Reference: {request.id}</p>
    <p className="mt-4 break-words text-sm">{request.address}, {request.city}, {request.state_code} {request.postal_code}, US</p>
    {operator && <p className="mt-2 break-words text-sm">{request.full_name} · {request.contact_email}{request.phone ? ` · ${request.phone}` : ''}</p>}
    {request.availability && <p className="mt-2 break-words text-sm">Preferred availability: {request.availability}</p>}
    {request.details && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.details}</p>}
    <p className="mt-3 text-xs text-muted-foreground">Received {new Date(request.created_at).toLocaleString()}</p>
    {request.agreed_total_cents !== null && <p className="mt-3 text-sm font-semibold">Agreed quote: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(request.agreed_total_cents / 100)} · Service date: {request.scheduled_date}. No online payment taken.</p>}
    <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-muted/50 p-4 text-sm">{request.customer_update || 'Awaiting manual review. This request is not yet a confirmed booking.'}</p>
    {!operator && ['received', 'reviewing'].includes(request.status) && <button disabled={cancel.isPending} onClick={() => {
      if (window.confirm('Cancel this unconfirmed service request?')) cancel.mutate();
    }} className="mt-4 text-sm font-semibold text-destructive disabled:opacity-50">{cancel.isPending ? 'Cancelling...' : 'Cancel request'}</button>}
    {cancel.error && <p role="alert" className="mt-3 text-sm text-destructive">{requestError(cancel.error)}</p>}
    {operator && <OperatorUpdate key={`${request.id}:${request.version}`} request={request} onSaved={onSaved} />}
  </article>;
}

export default function RequestList({ operator = false }: { operator?: boolean }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const rows = useQuery({
    queryKey: ['pilot-requests', user?.id, operator, page, status],
    queryFn: () => listRequests(page, status, operator ? undefined : user?.id),
    gcTime: 0, refetchInterval: 60_000, enabled: !!user,
  });
  const counts = useQuery({
    queryKey: ['pilot-counts', user?.id], queryFn: loadRequestCounts,
    enabled: !!user && operator, gcTime: 0, refetchInterval: 60_000,
  });
  const refresh = () => {
    void cache.invalidateQueries({ queryKey: ['pilot-requests', user?.id] });
    if (operator) void cache.invalidateQueries({ queryKey: ['pilot-counts', user?.id] });
  };
  return <div className="space-y-5">
    {operator && !counts.error && counts.data && <section aria-label="Request counts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(['total', 'received', 'reviewing', 'confirmed'] as const).map((name) => <div key={name} className={`rounded-2xl border p-5 ${name === 'received' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}><p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${name === 'received' ? 'text-white/80' : 'text-muted-foreground'}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${name === 'received' ? 'bg-orange-300' : 'bg-primary/40'}`} />{name}</p><p className="mt-4 text-3xl font-extrabold tabular-nums">{counts.data[name]}</p></div>)}
    </section>}
    {operator && !counts.error && counts.data && counts.data.received > 0 && <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm font-semibold">{counts.data.received} new request(s) need review. Dashboard reminders refresh every minute; no automatic email or push alerts are sent.</p>}
    {counts.error && operator && <p role="alert" className="text-sm text-destructive">Counts unavailable: {requestError(counts.error)}</p>}
    <div className="flex flex-wrap items-center gap-4">
      <label className="text-sm font-semibold">Status<select value={status} className="ml-2 rounded-lg border border-border bg-background p-2" onChange={(event) => { setStatus(event.target.value === '' ? '' : requestStatus.parse(event.target.value)); setPage(0); }}><option value="">All</option>{requestStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <button onClick={refresh} disabled={rows.isFetching} className="text-sm font-bold text-primary disabled:opacity-50">{rows.isFetching ? 'Refreshing...' : 'Refresh'}</button>
      {rows.data && <span className="text-sm text-muted-foreground">{rows.data.total} matching request(s)</span>}
    </div>
    {rows.isPending && <p role="status">Loading your requests...</p>}
    {rows.error && <p role="alert" className="rounded-xl border border-destructive/20 p-4 text-sm text-destructive">{requestError(rows.error)} No demo records are substituted. Refresh to try again.</p>}
    {!rows.error && rows.data?.rows.length === 0 && <p className="rounded-xl border border-border p-5">No requests on this page.</p>}
    {!rows.error && rows.data?.rows.map((request) => <RequestCard key={request.id} request={request} operator={operator} onSaved={refresh} />)}
    <div className="flex items-center gap-4">
      <button disabled={page === 0 || rows.isFetching} onClick={() => setPage(page - 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
      <span className="text-sm">Page {page + 1}</span>
      <button disabled={!rows.data || (page + 1) * REQUEST_PAGE_SIZE >= rows.data.total || rows.isFetching} onClick={() => setPage(page + 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Next</button>
    </div>
  </div>;
}
