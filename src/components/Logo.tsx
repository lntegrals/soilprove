export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 60 60" className="h-9 w-9" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sp-logo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="26" fill="url(#sp-logo)" />
        <path
          d="M16 28 Q30 16 44 28 Q30 40 16 28"
          fill="white"
          fillOpacity="0.92"
        />
        <circle cx="30" cy="36" r="3.2" fill="white" fillOpacity="0.85" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-bold tracking-tight text-slate-700">
          SoilProve
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Prototype demo
        </span>
      </div>
    </div>
  );
}
