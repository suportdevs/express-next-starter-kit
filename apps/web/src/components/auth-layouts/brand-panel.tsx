import { Check, Quote } from 'lucide-react';
import { appName, cn } from '@/lib/utils';

const highlights = ['Bank-grade security with passkeys & 2FA', 'Set up in minutes, scale to millions', 'Loved by teams in 40+ countries'];

/** Marketing side panel used by the split and card layouts. Edit the copy to match your product. */
export function BrandPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-fuchsia-600 p-10 text-white',
        className,
      )}
    >
      {/* Subtle grid + glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

      <div className="relative">
        <p className="text-sm font-medium uppercase tracking-widest text-white/70">{appName}</p>
        <h2 className="mt-4 max-w-sm text-3xl font-bold leading-tight">Everything you need to run your business, in one place.</h2>
        <ul className="mt-8 space-y-3 text-sm text-white/90">
          {highlights.map((h) => (
            <li key={h} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3.5 w-3.5" />
              </span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      <figure className="relative mt-10 rounded-2xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
        <Quote className="h-6 w-6 text-white/60" />
        <blockquote className="mt-3 text-sm leading-relaxed">
          &ldquo;We moved our whole team over in a weekend. Sign-in just works — passkeys, SSO-style social login, all of
          it.&rdquo;
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3 text-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 font-semibold">AM</span>
          <span>
            <span className="block font-semibold">Alex Morgan</span>
            <span className="text-white/70">Head of Product, Northwind</span>
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
