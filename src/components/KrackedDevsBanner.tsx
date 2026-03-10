export default function KrackedDevsBanner() {
  return (
    <section className="w-full bg-emerald-950 px-4 py-3 sm:px-8 lg:px-16">
      <div className="mx-auto w-full max-w-7xl">
        <a
          href="https://krackeddevs.com/showcase/project/e9ce5fdb-e178-4be7-8d32-12c66a24138e"
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-emerald-900/60 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-emerald-900/50 hover:shadow-xl"
        >
          {/* Subtle glow accent */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
            {/* Left: Text content */}
            <div className="flex flex-1 flex-col gap-1">
              {/* Badge */}
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                ☽ Ramadan Challenge 2026
              </span>

              {/* Headline */}
              <p className="mt-0.5 text-base font-bold text-white sm:text-lg">
                Sokong projek kami di{' '}
                <span className="text-emerald-300">KrakkedDevs</span>
              </p>

              {/* Description */}
              <p className="text-xs leading-relaxed text-emerald-100/70 sm:text-sm">
                Jejak Masjid menyertai Ramadan Developer Challenge.
              </p>
            </div>

            {/* Right: Logo + CTA */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
              <img
                src="/kdlogodev.svg"
                alt="KrakkedDevs logo"
                className="h-8 w-auto object-contain opacity-90 sm:h-10"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-bold text-emerald-950 shadow-md transition-all duration-200 group-hover:bg-white group-hover:shadow-lg sm:px-5 sm:py-2 sm:text-sm">
                Find Out More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
