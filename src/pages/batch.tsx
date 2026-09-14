import { Helmet } from '@dr.pogodin/react-helmet';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, CheckCircle, MapPin, Users } from 'lucide-react';
import { getBatchByCode, type Batch } from '../lib/batches';

export default function BatchPage() {
  const { code = '' } = useParams();
  const normalizedCode = decodeURIComponent(code).toUpperCase();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not_found' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    getBatchByCode(normalizedCode)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setLoadState('not_found');
          return;
        }
        setBatch(found);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedCode]);

  if (loadState === 'loading') {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (loadState === 'not_found' || loadState === 'unavailable' || !batch) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-foreground">That batch link is no longer active</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loadState === 'unavailable'
              ? "We couldn't reach the database. Please try again shortly."
              : 'Check the code with your neighbor or search for a new service area.'}
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white">
            Check another street <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const savings = batch.soloPrice - batch.batchPrice;

  return (
    <>
      <Helmet>
        <title>{batch.street} Batch — Blokpakt</title>
        <meta name="description" content={`Join the active ${batch.street} ${batch.service} batch and save $${savings}.`} />
      </Helmet>
      <main className="min-h-screen bg-muted/30 py-12 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle size={17} /> Active neighborhood batch
          </div>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Referral {batch.code}</p>
            <h1 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">Join the {batch.street} route</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              Your neighbor started a {batch.service.toLowerCase()} batch. Join the same route to unlock the group rate.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <MapPin size={18} className="text-accent" />
                <p className="mt-3 text-xs text-muted-foreground">Service area</p>
                <p className="font-bold text-foreground">{batch.street}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <Users size={18} className="text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">Homes booked</p>
                <p className="font-bold text-foreground">{batch.homesBooked} of {batch.targetHomes}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <CheckCircle size={18} className="text-accent" />
                <p className="mt-3 text-xs text-muted-foreground">Your batch rate</p>
                <p className="font-bold text-primary">${batch.batchPrice} <span className="text-xs font-normal text-muted-foreground">save ${savings}</span></p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/book?batch=${encodeURIComponent(batch.code)}`)}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white hover:bg-accent/90 sm:w-auto"
            >
              Join this batch <ArrowRight size={17} />
            </button>
          </section>
        </div>
      </main>
    </>
  );
}