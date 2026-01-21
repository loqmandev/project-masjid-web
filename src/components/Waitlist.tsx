import { useState } from 'react';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, isBetaTester });
    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="bg-[linear-gradient(180deg,_rgba(255,204,0,0.12)_0%,_var(--color-background)_50%,_rgba(0,169,165,0.12)_100%)] py-16">
      <div className="mx-auto max-w-240 px-4">
        <div className="mx-auto max-w-137.5 rounded-2xl border border-border bg-card/80 p-10 text-center shadow-[0_14px_32px_rgba(0,79,77,0.08)]">
          <h2 className="mb-12 text-[2.5rem] font-bold text-foreground">Join the Journey</h2>
          <p className="mb-8 text-[1.1rem] text-muted-foreground">
            Be among the first to experience Jejak Masjid. Sign up now to become a beta tester.
          </p>

          {submitted ? (
            <div>
              <h3 className="mb-2 text-[1.8rem] text-secondary-foreground">Thank You!</h3>
              <p className="text-[1.1rem] text-muted-foreground">We will contact you soon.</p>
            </div>
          ) : (
            <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-[0.8rem] text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="inline-block rounded-lg bg-primary px-6 py-[0.8rem] font-medium text-primary-foreground shadow-[0_12px_24px_rgba(0,169,165,0.2)] transition-all duration-300 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
