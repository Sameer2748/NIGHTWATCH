'use client';

import Marquee from '@/components/Marquee';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Highlighter } from '@/components/Highlighter';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/Logo';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleStartForFree = () => {
    if (email) {
      router.push(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Navbar */}
      <nav className="max-w-[90%] mx-auto py-6 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">NIGHTWATCH</span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex gap-4 items-center">
            <Link href="/signin">
              <button className="bg-transparent border border-border-color text-text-secondary px-4 py-2 rounded-md cursor-pointer hover:text-text-primary hover:border-text-muted transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-button-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-button-primaryHover transition-colors">
                Sign up
              </button>
            </Link>
            <button
              onClick={(e) => {
                // Play audio
                const audio = new Audio('/audio/nakime_biwa.mp3');
                audio.play().catch(err => console.log('Audio play failed:', err));
                // Toggle theme
                toggleTheme(e);
              }}
              className="p-2 rounded-lg hover:bg-card-bg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                // Sun icon for light mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered content */}
      <section className="relative h-[calc(100vh-5rem)]">
        <div className="max-w-[90%] mx-auto h-full relative flex items-center justify-center">
          <div className="text-center max-w-4xl">
            {/* Main Heading - Three Words */}
            <h1 className="text-[4.5rem] font-bold leading-[1.1] mb-8 tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-helvetica-now)' }}>
              <Highlighter action="highlight"  >Monitor</Highlighter>. Alert. <span>Resolve.</span>
            </h1>

            {/* Email Form */}
            <div className="flex gap-4 mb-8 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Your work e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartForFree();
                  }
                }}
                className="flex-1 px-5 py-3.5 bg-white/5 border border-border-color rounded-md text-text-primary text-[0.95rem] outline-none focus:border-button-primary transition-colors placeholder:text-text-muted"
              />
              <button
                onClick={handleStartForFree}
                className="bg-button-primary border-none text-button-text px-8 py-3.5 rounded-md cursor-pointer text-[0.95rem] font-medium whitespace-nowrap hover:bg-button-primary-hover transition-colors"
              >
                Start for free
              </button>
            </div>

            {/* Description */}
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              NIGHTWATCH is an open-source uptime monitoring tool designed to keep your services under control. 🌍<br />
              Built with love as a personal project to provide reliable, real-time insights into system health and performance.
            </p>
          </div>
        </div>
      </section>


      <Marquee>

        <div className="flex items-center gap-16 px-8">
          <span className="text-text-muted text-xl font-medium">Vercel</span>
          <span className="text-text-muted text-xl font-medium">AMETEK</span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818-5.423 0-9.818-4.395-9.818-9.818 0-5.423 4.395-9.818 9.818-9.818z" />
            </svg>
            redis
          </span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Octopus Deploy
          </span>
          <span className="text-text-muted text-xl font-medium">accenture</span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <rect width="24" height="24" rx="4" />
            </svg>
            Raspberry Pi
          </span>
        </div>


        <div className="flex items-center gap-16 px-8">
          <span className="text-text-muted text-xl font-medium">Vercel</span>
          <span className="text-text-muted text-xl font-medium">AMETEK</span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818-5.423 0-9.818-4.395-9.818-9.818 0-5.423 4.395-9.818 9.818-9.818z" />
            </svg>
            redis
          </span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Octopus Deploy
          </span>
          <span className="text-text-muted text-xl font-medium">accenture</span>
          <span className="text-text-muted text-xl font-medium flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <rect width="24" height="24" rx="4" />
            </svg>
            Raspberry Pi
          </span>
        </div>
      </Marquee>

      {/* Pricing Comparison Section */}
      <section className="relative w-full py-16">
        <div className="max-w-[90%] mx-auto">
          <div className="flex gap-12 items-start">
            {/* Left Content */}
            <div className="w-1/2">
              <h2 className="text-[3rem] font-bold leading-[1.1] mb-4 text-text-primary">
                Simple, transparent<br />
                pricing for everyone
              </h2>

              <p className="text-base text-text-secondary mb-6 leading-snug">
                Start for free and keep your services in check.<br />
                Upgrade to Pro for advanced features and<br />
                detailed insights without breaking the bank.
              </p>

              <button className="bg-button-primary text-button-text px-5 py-2.5 rounded-md font-medium hover:bg-button-primary-hover transition-colors flex items-center gap-2 text-sm">
                Explore pricing
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Stats */}
              <div className="flex gap-12 mt-10">
                <div>
                  <p className="text-xs text-text-muted mb-1">Up to</p>
                  <p className="text-[2.5rem] font-bold text-text-primary leading-none">Unlimited</p>
                  <p className="text-xs text-text-muted mt-1">public status pages</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Check every</p>
                  <p className="text-[2.5rem] font-bold text-text-primary leading-none">30 sec</p>
                  <p className="text-xs text-text-muted mt-1">on the Pro plan</p>
                </div>
              </div>
            </div>

            {/* Right Pricing Table */}
            <div className="w-1/2">
              <div className="bg-card-bg border border-border-color rounded-xl p-6">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">3 min</p>
                    <p className="text-xs text-text-muted">checks on Free</p>
                    <p className="text-xs text-text-muted">1-day retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">30 sec</p>
                    <p className="text-xs text-text-muted">checks on Pro</p>
                    <p className="text-xs text-text-muted">30-day retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">Alerts</p>
                    <p className="text-xs text-text-muted">Email, SMS & Slack</p>
                    <p className="text-xs text-text-muted">on all plans</p>
                  </div>
                </div>

                {/* Free Tier Row */}
                <div className="bg-bg-primary border border-border-color rounded-lg p-3 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-text-muted/20 rounded flex items-center justify-center text-xs font-bold text-text-primary">
                      F
                    </div>
                    <span className="text-text-primary font-medium text-sm">Free Plan</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-primary font-bold text-lg">$0</span>
                    <span className="text-text-muted text-xs"> per month</span>
                  </div>
                </div>

                {/* Pro Tier Row */}
                <div className="bg-bg-primary border-2 border-button-primary rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-button-primary rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v11c0 5.25 3.41 10.19 8 11.5 4.59-1.31 8-6.25 8-11.5V5l-8-3z" />
                      </svg>
                    </div>
                    <span className="text-text-primary font-medium text-sm">NIGHTWATCH Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="text-button-primary font-bold text-lg">$5</span>
                    <span className="text-text-muted text-xs"> per month</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[0.65rem] text-text-muted mt-4 leading-relaxed text-center">
                  Simple pricing for simple needs. No hidden costs or complex tiers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative w-full py-20 bg-bg-primary">
        <div className="max-w-[90%] mx-auto text-center">
          <h2 className="text-[2.5rem] font-bold mb-4 text-text-primary">
            Don't just take our word for it
          </h2>

          <p className="text-base text-text-secondary mb-12 max-w-2xl mx-auto">
            We're proud to be working with publicly traded companies as well as individual<br />
            indie hackers and are thankful for their feedback, suggestions, and support.
          </p>

          {/* Company Logos Marquee */}
          <Marquee>
            <div className="flex items-center gap-16 px-8">
              <span className="text-text-muted text-lg font-medium opacity-60">accenture</span>
              <span className="text-text-muted text-lg font-medium opacity-60">accenture</span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect width="24" height="24" rx="4" />
                </svg>
                Raspberry Pi
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                brave
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60">DRATA</span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                unicef
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60">Carta</span>
            </div>

            {/* Duplicate for seamless loop */}
            <div className="flex items-center gap-16 px-8">
              <span className="text-text-muted text-lg font-medium opacity-60">accenture</span>
              <span className="text-text-muted text-lg font-medium opacity-60">accenture</span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect width="24" height="24" rx="4" />
                </svg>
                Raspberry Pi
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                brave
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60">DRATA</span>
              <span className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                unicef
              </span>
              <span className="text-text-muted text-lg font-medium opacity-60">Carta</span>
            </div>
          </Marquee>

          {/* Testimonial Cards - Curated Masonry with Alternating Rhythm */}
          <div className="max-w-[90%] mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-20">

            {/* Column 1: Small - Big - Small */}
            <div className="space-y-4">
              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors italic mb-4">
                  "Most intuitive monitoring tool I've used. It just works."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">SC</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Sarah Chen</p>
                    <p className="text-[9px] text-text-muted">@sarahc</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "NIGHTWATCH is one of the best products I've ever used. Went from 0-100 on logging in 15 minutes. The developer experience is just on another level compared to anything else in the market. Absolutely incredible DX."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-button-primary rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-button-primary/20">
                    C
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-text-primary">Conor</p>
                    <p className="text-[0.65rem] text-text-muted">@cnrstvns</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors mb-4">
                  "The status pages are a game changer for us."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">AR</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Alex Rivera</p>
                    <p className="text-[9px] text-text-muted">@alexriv</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Big - Small - Big */}
            <div className="space-y-4">
              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "By far @NIGHTWATCH has given me more pleasant surprises than any other tool. We had a critical outage due to a domain name expiring, and it turned out we could set up an alert for that instantly. Saved our reputation on day one."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-theme-secondary rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-theme-secondary/20">
                    J
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-text-primary">John</p>
                    <p className="text-[0.65rem] text-text-muted">@johncjago</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors font-semibold mb-4 text-button-primary">
                  "Generous free plan for start."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">MP</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Maya Patel</p>
                    <p className="text-[9px] text-text-muted">@mayap</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-4 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "Compared it to Datadog and BetterStack. For a personal project or a fast-moving startup, NIGHTWATCH is the clear winner for cost and ease of use. No contest."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">DK</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">David Kim</p>
                    <p className="text-[9px] text-text-muted">@dkim_dev</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Small - Big - Small */}
            <div className="space-y-4">
              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors mb-4">
                  "Slack integration took 20 seconds. Literally."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">JS</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Jordan Smith</p>
                    <p className="text-[9px] text-text-muted">@jordans</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "Support answered my DMs in minutes. First actually cool status page that allows custom domains on a budget. The dashboard UI is incredibly smooth."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-button-primary rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">NL</div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-text-primary">NeverLand</p>
                    <p className="text-[0.65rem] text-text-muted">@neverlandoff</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group font-medium">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors mb-4 italic">
                  "Setup in under 5 minutes. Amazing DX."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">EG</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Elena Gomez</p>
                    <p className="text-[9px] text-text-muted">@elenag</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Big - Small - Big */}
            <div className="space-y-4">
              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "I'm utterly blown away. They do everything. Monitoring US servers, custom alerts, website downtime, incident logging... and it looks gorgeous. 🤯"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-theme-secondary rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-theme-secondary/20">
                    D
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-text-primary">Darren Pinder</p>
                    <p className="text-[0.65rem] text-text-muted">@dmpinder</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-6 hover:-translate-y-1 hover:border-button-primary/30 transition-all group italic">
                <p className="text-sm text-text-secondary leading-relaxed text-left group-hover:text-text-primary transition-colors mb-4">
                  "Switched from BetterStack. Happy so far."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">MT</div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-text-primary">Marcus Thorne</p>
                    <p className="text-[9px] text-text-muted">@mthorne</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg/40 backdrop-blur-md border border-border-color rounded-2xl p-8 hover:-translate-y-1 hover:border-button-primary/30 transition-all group">
                <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left group-hover:text-text-primary transition-colors">
                  "One year one tool. @linear won my heart last year. This year so far, @NIGHTWATCH is the frontrunner 👏"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-button-primary rounded-full flex items-center justify-center text-xs font-bold text-white">T</div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-text-primary">Tianzhou</p>
                    <p className="text-[0.65rem] text-text-muted">@tianzhouchan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full bg-bg-primary border-t border-border-color py-12">
        <div className="max-w-[90%] mx-auto">
          <div className="flex justify-between items-start mb-12">
            {/* Left - Branding */}
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-4">
                <Logo className="w-7 h-7" animated={false} />
                <span className="text-xl font-bold text-text-primary tracking-tight">NIGHTWATCH</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                NIGHTWATCH is an open-source uptime monitoring tool designed to keep your services under control. 🌍 Built with love as a personal project to provide reliable, real-time insights into system health and performance.
              </p>
            </div>

            {/* Right - Contact & Social */}
            <div className="flex flex-col items-end gap-6">
              <div className="flex flex-col items-end gap-2 text-sm text-text-secondary">
                <a href="tel:9518074060" className="hover:text-text-primary transition-colors">
                  +91 95180 74060
                </a>
                <a href="mailto:100xsam@gmail.com" className="hover:text-text-primary transition-colors">
                  100xsam@gmail.com
                </a>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a href="https://x.com/100x_Sam" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors p-2 bg-text-muted/5 rounded-lg border border-transparent hover:border-button-primary/20 transition-all" title="X (Twitter)">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
                  </svg>
                </a>
                <a href="http://github.com/Sameer2748" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors p-2 bg-text-muted/5 rounded-lg border border-transparent hover:border-button-primary/20 transition-all" title="GitHub">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/sameer-rao-7576261ab/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors p-2 bg-text-muted/5 rounded-lg border border-transparent hover:border-button-primary/20 transition-all" title="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border-color/30 gap-4">
            <p className="text-xs text-text-muted">
              © 2024-2026 NIGHTWATCH. All rights reserved. Built with ❤️ by Sameer.
            </p>
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
