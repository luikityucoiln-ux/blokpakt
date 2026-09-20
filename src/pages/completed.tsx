import { Helmet } from '@dr.pogodin/react-helmet';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

const services = [
	{
		id: 'lawn', emoji: '🌱', name: 'Lawn Care', soloPrice: 50, batchPrice: 45, duration: 'About 30 minutes (up to 0.25 acres)', addon: 'Bag & haul clippings (+$15)',
		included: ['Mow and edge accessible lawn areas', 'Blow clippings from walkways and driveways', 'Basic cleanup of the serviced area'],
		excluded: ['Overgrown-lot restoration (>6 inches)', 'Tree trimming or hedge work', 'Areas above 0.25-acre standard limit'],
	},
	{
		id: 'gutter', emoji: '🍂', name: 'Gutter Cleaning', soloPrice: 180, batchPrice: 162, duration: 'About 90 minutes for a standard home', addon: 'Downspout guard installation (+$25)',
		included: ['Remove accessible gutter debris', 'Flush gutters and downspouts', 'Clear and tidy the work area'],
		excluded: ['Structural gutter repairs', 'Work on unsafe roof surfaces', 'Interior drainage repairs'],
	},
	{
		id: 'pressure', emoji: '💦', name: 'Pressure Washing', soloPrice: 220, batchPrice: 198, duration: 'About 2 hours for a driveway and walkways', addon: 'Patio furniture rinse (+$20)',
		included: ['Wash driveway and walkway surfaces', 'Apply surface-safe cleaning solution', 'Rinse adjacent work areas'],
		excluded: ['Window cleaning', 'Paint removal', 'Sealed-stone restoration'],
	},
	{
		id: 'snow', emoji: '❄️', name: 'Snow Removal', soloPrice: 64, batchPrice: 58, duration: 'About 45 minutes for a standard driveway', addon: 'De-icing salt application (+$12)',
		included: ['Clear driveway and front walkway', 'Create a safe path to the entry', 'Stack snow at the curbside edge'],
		excluded: ['Hauling snow off-site', 'Roof snow removal', 'Clearing private roads'],
	},
] as const;

const contractors = [
	{ initials: 'MT', name: 'Marcus T.', rating: '4.9', jobs: 312, distance: '0.8 mi', captain: true },
	{ initials: 'DR', name: 'Devon R.', rating: '4.7', jobs: 189, distance: '1.4 mi', captain: false },
	{ initials: 'PS', name: 'Priya S.', rating: '4.8', jobs: 241, distance: '2.1 mi', captain: false },
];

export default function CompletedPage() {
	const [selectedServiceId, setSelectedServiceId] = useState('lawn');
	const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
	const service = services.find((item) => item.id === selectedServiceId) ?? services[0];
	const savings = service.soloPrice - service.batchPrice;

	return (
		<>
			<Helmet>
				<title>Choose a Service - Blokpakt</title>
				<meta name="description" content="Choose a neighborhood service and a local contractor." />
			</Helmet>
			<main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:py-14">
				<div className="mx-auto max-w-6xl">
					<h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Pick your service. We handle the rest.</h1>

					<div aria-label="Services" className="mt-6 flex flex-wrap gap-2">
						{services.map((item) => {
							const isSelected = item.id === service.id;
							return (
								<button
									key={item.id}
									type="button"
									aria-pressed={isSelected}
									onClick={() => setSelectedServiceId(item.id)}
									className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground hover:bg-muted/75'}`}
								>
									<span aria-hidden="true">{item.emoji}</span>
									{item.name}
								</button>
							);
						})}
					</div>

					<div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
						<section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
							<h2 className="text-xs font-bold uppercase tracking-wider text-primary/75">{service.name} - Pricing</h2>

							<div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
								<div>
									<p className="flex items-center gap-1.5 font-semibold text-foreground"><span aria-hidden="true">👤</span> Solo Rate</p>
									<p className="mt-0.5 text-sm text-muted-foreground">Just you on the route</p>
								</div>
								<p className="text-2xl font-bold text-foreground">${service.soloPrice}</p>
							</div>

							<div className="mt-3 flex items-center justify-between rounded-lg border-2 border-foreground bg-card p-4 shadow-sm">
								<div>
									<p className="flex items-center gap-1.5 font-semibold text-foreground"><span aria-hidden="true">🏘️</span> Street Batch Rate</p>
									<p className="mt-0.5 text-sm text-muted-foreground">2+ neighbors on your block</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold text-foreground">${service.batchPrice}</p>
									<span className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">🏷️ Save ${savings}</span>
								</div>
							</div>

							<p className="mt-4 text-xs leading-relaxed text-muted-foreground">ℹ️ Prices unlock automatically when 2+ homes on your street book the same service window. No coupon codes needed.</p>

							<div className="my-6 border-t border-border" />

							<div className="grid gap-6 text-sm md:grid-cols-2">
								<div>
									<h3 className="font-bold text-foreground">What is included</h3>
									<ul className="mt-3 space-y-2 text-muted-foreground">
										{service.included.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">✅</span><span>{item}</span></li>)}
									</ul>
								</div>
								<div>
									<h3 className="font-bold text-foreground">Usually not included</h3>
									<ul className="mt-3 space-y-2 text-muted-foreground">
										{service.excluded.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">❌</span><span>{item}</span></li>)}
									</ul>
								</div>
							</div>

							<div className="mt-6 grid gap-4 rounded-lg border border-border bg-muted/35 p-4 text-xs text-muted-foreground md:grid-cols-2">
								<p><span className="font-semibold text-foreground">⏱️ Typical time:</span> {service.duration}</p>
								<p><span className="font-semibold text-foreground">➕ Common add-ons:</span> {service.addon}</p>
							</div>
						</section>

						<aside className="lg:col-span-5">
							<h2 className="text-xs font-bold uppercase tracking-wider text-primary/75">Available Contractors Near You</h2>
							<div className="mt-3 space-y-3">
								{contractors.map((contractor) => {
									const isSelected = selectedContractor === contractor.initials;
									return (
										<button
											key={contractor.initials}
											type="button"
											aria-pressed={isSelected}
											onClick={() => setSelectedContractor(contractor.initials)}
											className={`flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-foreground/40'}`}
										>
											<span className="flex items-center gap-3">
												<span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">{contractor.initials}</span>
												<span>
													<span className="flex flex-wrap items-center gap-2 font-bold text-foreground">
														{contractor.name}
														{contractor.captain && <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-foreground">🏅 Block Captain</span>}
													</span>
													<span className="mt-0.5 block text-xs text-muted-foreground">⭐ {contractor.rating} ({contractor.jobs} jobs) • 📍 {contractor.distance}</span>
												</span>
											</span>
											<ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
										</button>
									);
								})}
							</div>
						</aside>
					</div>
				</div>
			</main>
		</>
	);
}
