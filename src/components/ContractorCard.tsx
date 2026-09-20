import { BadgeCheck, ChevronRight, MessageCircle, Star, Truck } from 'lucide-react';

export interface ContractorProfile {
  id: string;
  name: string;
  initials: string;
  publicId: string;
  rating: number;
  jobs: number;
  distance: string;
  services: string[];
  blockCaptain?: boolean;
}

interface ContractorCardProps {
  contractor: ContractorProfile;
  isSelected: boolean;
  isInteractive: boolean;
  onSelect?: (contractorId: string) => void;
  onContact?: (contractor: ContractorProfile) => void;
}

export function ContractorCard({ contractor, isSelected, isInteractive, onSelect, onContact }: ContractorCardProps) {
  return (
    <article className={`rounded-lg border bg-card p-4 ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-label="Business vehicle placeholder">
          <Truck aria-hidden="true" className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-foreground">{contractor.name}</h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <BadgeCheck aria-hidden="true" className="size-3.5" />
              ID Verified
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">ID: {contractor.publicId}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star aria-hidden="true" className="size-3 fill-amber-400 text-amber-400" />
            {contractor.rating} · {contractor.jobs} jobs · {contractor.distance}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {contractor.services.map((service) => (
          <span key={service} className="rounded-full border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground">{service}</span>
        ))}
        {contractor.blockCaptain && <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-semibold text-foreground">Block Captain</span>}
      </div>

      {isInteractive && (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => onSelect?.(contractor.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted">
            {isSelected ? 'Selected provider' : 'Select provider'}
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          <button type="button" onClick={() => onContact?.(contractor)} className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90" aria-label={`Contact ${contractor.name}`} title="Contact Provider">
            <MessageCircle aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </article>
  );
}