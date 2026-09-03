import { motion } from 'motion/react';
import { Home, Users } from 'lucide-react';

interface StreetProgressMockupProps {
  streetName: string;
  booked: number;
  goal: number;
  discount: string;
  label: string;
}

export default function StreetProgressMockup({
  streetName,
  booked,
  goal,
  discount,
  label,
}: StreetProgressMockupProps) {
  const progress = (booked / goal) * 100;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Floating card */}
      <div className="rounded-2xl bg-card border border-border shadow-2xl p-6 relative overflow-hidden">
        {/* Subtle grid texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Route</p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{streetName}</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
            {discount} off
          </span>
        </div>

        {/* Home icons row */}
        <div className="flex items-center gap-2 mb-3">
          {Array.from({ length: goal + 1 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all ${
                i < booked
                  ? 'bg-primary border-primary text-primary-foreground'
                  : i === booked
                  ? 'bg-accent/10 border-accent border-dashed text-accent'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              <Home size={16} />
            </div>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={12} />
            <span>{booked}/{goal + 1} homes</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          />
        </div>

        {/* Status text */}
        <p className="text-sm text-foreground/70">
          <span className="font-semibold text-foreground">Booked: {booked} home</span>
          {' '}|{' '}
          <span className="text-accent font-medium">Goal: {goal}+ homes to {label}</span>
        </p>

        {/* Bottom action */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-muted-foreground">Waiting for neighbors</span>
          </div>
          <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            Share street link →
          </button>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.4, type: 'spring', stiffness: 300 }}
      >
        Unlock group rate
      </motion.div>
    </div>
  );
}
