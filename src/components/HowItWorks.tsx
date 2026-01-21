import { Camera, CheckCircle2, Clock, MapPin } from 'lucide-react'

const HowItWorks = () => {
  return (
    <section className="bg-muted py-16">
      <div className="mx-auto max-w-240 px-4">
        <h2 className="mb-12 text-center text-[2.5rem] font-bold text-foreground">How It Works</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[0_10px_24px_rgba(0,79,77,0.08)]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/60 text-secondary-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="mb-4 text-[1.2rem] font-semibold text-secondary-foreground">1. Find a Nearby Masjid</h4>
            <p className="text-base leading-[1.6] text-muted-foreground">Explore places around you when you feel called to visit.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[0_10px_24px_rgba(0,79,77,0.08)]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/60 text-secondary-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="mb-4 text-[1.2rem] font-semibold text-secondary-foreground">2. Check In on Arrival</h4>
            <p className="text-base leading-[1.6] text-muted-foreground">Mark your presence with a simple check-in.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[0_10px_24px_rgba(0,79,77,0.08)]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/60 text-secondary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="mb-4 text-[1.2rem] font-semibold text-secondary-foreground">3. Check Out When You Leave</h4>
            <p className="text-base leading-[1.6] text-muted-foreground">Close the visit when you're done, so your journey stays complete.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[0_10px_24px_rgba(0,79,77,0.08)]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/60 text-secondary-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <h4 className="mb-4 text-[1.2rem] font-semibold text-secondary-foreground">4. Contribute When You Can</h4>
            <p className="text-base leading-[1.6] text-muted-foreground">Share photos or updates about facilities to help others. (Coming soon.)</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
