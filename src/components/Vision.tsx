const Vision = () => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-240 px-4">
        <div>
          <h2 className="mb-12 text-center text-[2.5rem] font-bold text-foreground">Why Jejak Masjid?</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/80 p-6 text-center shadow-[0_8px_24px_rgba(0,79,77,0.08)]">
              <h3 className="mb-4 text-2xl font-semibold text-secondary-foreground">A Gentle Community</h3>
              <p className="text-base leading-[1.6] text-muted-foreground">We want to create a community that quietly encourages each other to visit and explore masjids more often.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-6 text-center shadow-[0_8px_24px_rgba(0,79,77,0.08)]">
              <h3 className="mb-4 text-2xl font-semibold text-secondary-foreground">More Visits, More Presence</h3>
              <p className="text-base leading-[1.6] text-muted-foreground">Small reminders and shared intent help turn passing moments into meaningful visits.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-6 text-center shadow-[0_8px_24px_rgba(0,79,77,0.08)]">
              <h3 className="mb-4 text-2xl font-semibold text-secondary-foreground">Masjid Directory, Together</h3>
              <p className="text-base leading-[1.6] text-muted-foreground">Contributions like photos, reviews, and facility updates build a helpful, living directory for everyone.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Vision;
