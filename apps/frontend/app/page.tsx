'use client';

import Marquee from '@/components/Marquee';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Highlighter } from '@/components/Highlighter';
export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Navbar */}
      <nav className="max-w-[90%] mx-auto py-6 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 256 256" fill="none">
              <path d="M 128 0 C 198.692 0 256 57.308 256 128 C 256 198.692 198.692 256 128 256 C 57.308 256 0 198.692 0 128 C 0 57.308 57.308 0 128 0 Z M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.019 74.98 224 128 224 C 181.019 224 224 181.019 224 128 C 224 74.98 181.019 32 128 32 Z M 128 112 C 136.837 112 144 119.163 144 128 C 144 136.837 136.837 144 128 144 C 119.163 144 112 136.837 112 128 C 112 119.163 119.163 112 128 112 Z" fill="currentColor" />
            </svg>
            <span className="text-xl font-bold">NIGHTWATCH</span>
          </div>

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
              onClick={() => {
                // Play audio
                const audio = new Audio('/audio/anime-ahh.mp3');
                audio.play().catch(err => console.log('Audio play failed:', err));
                // Toggle theme
                toggleTheme();
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
                className="flex-1 px-5 py-3.5 bg-white/5 border border-border-color rounded-md text-text-primary text-[0.95rem] outline-none focus:border-button-primary transition-colors placeholder:text-text-muted"
              />
              <button className="bg-button-primary border-none text-button-text px-8 py-3.5 rounded-md cursor-pointer text-[0.95rem] font-medium whitespace-nowrap hover:bg-button-primary-hover transition-colors">
                Start for free
              </button>
            </div>

            {/* Description */}
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              NIGHTWATCH runs a fast-growing portfolio of highly reliable uptime monitoring
              services with millions of users across the globe. 🌍<br />
              We've been profitable since day 1 and have grown by over 30%
              in reliability (YoY) for the last 10 years.
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
                At a fraction of<br />
                your current costs
              </h2>

              <p className="text-base text-text-secondary mb-6 leading-snug">
                Get an unrivaled price-to-performance ratio.<br />
                Decrease your budget by 30x or keep your<br />
                current budget but actually instrument all of<br />
                your services, without sampling.
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
                  <p className="text-xs text-text-muted mb-1">Ingest up to</p>
                  <p className="text-[2.5rem] font-bold text-text-primary leading-none">33x more data</p>
                  <p className="text-xs text-text-muted mt-1">with the same budget</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">or save up to</p>
                  <p className="text-[2.5rem] font-bold text-text-primary leading-none">97%</p>
                  <p className="text-xs text-text-muted mt-1">of your costs</p>
                </div>
              </div>
            </div>

            {/* Right Pricing Table */}
            <div className="w-1/2">
              <div className="bg-card-bg border border-border-color rounded-xl p-6">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">1 TB</p>
                    <p className="text-xs text-text-muted">traces per month</p>
                    <p className="text-xs text-text-muted">30-day retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">1 TB</p>
                    <p className="text-xs text-text-muted">logs per month</p>
                    <p className="text-xs text-text-muted">30-day retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary mb-0.5">150B</p>
                    <p className="text-xs text-text-muted">metrics data points</p>
                    <p className="text-xs text-text-muted">13-month retention</p>
                  </div>
                </div>

                {/* Datadog Row */}
                <div className="bg-bg-primary border border-border-color rounded-lg p-3 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-text-muted/20 rounded flex items-center justify-center text-xs font-bold text-text-primary">
                      D
                    </div>
                    <span className="text-text-primary font-medium text-sm">Datadog</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted text-xs">approx. </span>
                    <span className="text-text-primary font-bold text-lg">$28,000</span>
                    <span className="text-text-muted text-xs"> per month</span>
                  </div>
                </div>

                {/* Better Stack Row */}
                <div className="bg-bg-primary border-2 border-button-primary rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-button-primary rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span className="text-text-primary font-medium text-sm">Better Stack</span>
                  </div>
                  <div className="text-right">
                    <span className="text-button-primary font-bold text-lg">$879</span>
                    <span className="text-text-muted text-xs"> per month</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[0.65rem] text-text-muted mt-4 leading-relaxed">
                  An estimate only. Assumes annual payments, European data location, 1 tracer/node with a production bundle, the average event size of 1 kb, 50 custom metrics, 1 Datadog service, 1 container per service metric check to account for the equivalent of 6.7 TB Better Stack's metric data points. Further assumes Datadog's $0.1 per ingested GB of spans & logs, and $0.57/host indexed spans & logs for 30 days. Adds up to $22,478 for metrics, $2,786 for logs, and $2,786 for spans per month.
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

          {/* Testimonial Cards Grid - Bento Style */}
          <div className="max-w-[90%] mx-auto mt-12">
            <div className="grid grid-cols-4 gap-3 auto-rows-[minmax(100px,auto)]">
              {/* Card 1 - Conor (medium) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-3">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  @NIGHTWATCH is one of the best products I've ever used. Went from 0-100 on logging in 15 minutes. Incredible
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-button-primary rounded-full flex items-center justify-center text-xs font-bold text-white">
                    C
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">Conor</p>
                    <p className="text-[0.65rem] text-text-muted">@cnrstvns</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 2 - John (tall) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-4">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  By far @NIGHTWATCH has given me more pleasant surprises other tool in this space. We had an outage due to a domain name expiring, and it turns out we can even be alerted about that. Great user experience and UI on top of all the features. How is it not more popular?
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-theme-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
                    J
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">John</p>
                    <p className="text-[0.65rem] text-text-muted">@johncjago</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 3 - NeverLand (tall) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-4">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  Looking for a status page? I recommend @NIGHTWATCH. Perfect support, answered my dms in a couple of minutes, and it's the first actual cool looking status page which allows custom domains (on the free plan 🏠) haven't actually tried it, but it looks good so far.
                </p>
                <p className="text-xs text-text-muted mb-3">#NotSponsor</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-button-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">NeverLand</p>
                    <p className="text-[0.65rem] text-text-muted">@neverlandoff</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 4 - Darren (very tall) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-5">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  I'm utterly blown away by @NIGHTWATCH! They do everything. I'm now monitoring one of our US servers for every kind of log Ubuntu creates, custom alerts for errors, website downtime, incident logging, Slack notifications, S3 log storage, and loads more. 🤯
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-theme-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
                    D
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">Darren Pinder</p>
                    <p className="text-[0.65rem] text-text-muted">@dmpinder</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 5 - Quentin (medium) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-3">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  I tested @NIGHTWATCH for @gamubsapp! So much easier to configure and the interface is better than @FreshworksInc!
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-text-muted/20 rounded-full flex items-center justify-center text-xs font-bold text-text-primary">
                    Q
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">Quentin</p>
                    <p className="text-[0.65rem] text-text-muted">@glaffont</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 6 - Tianzhou (medium) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-3">
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  One year one tool. @linear won my heart last year. This year so far, @NIGHTWATCH is the frontrunner, well designed 👏
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-button-primary rounded-full flex items-center justify-center text-xs font-bold text-white">
                    T
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">Tianzhou</p>
                    <p className="text-[0.65rem] text-text-muted">@tianzhouchan</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>

              {/* Card 7 - Status page (short) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-2">
                <p className="text-sm text-text-secondary leading-relaxed">
                  @NIGHTWATCH status page looks SO neat! A fantastic tool for SaaS products like
                </p>
              </div>

              {/* Card 8 - Switched (short) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-2">
                <p className="text-sm text-text-secondary leading-relaxed">
                  Switched from @Statuspage to @NIGHTWATCH over the week end, looking pretty good
                </p>
              </div>

              {/* Card 9 - Love services (short) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-2">
                <p className="text-sm text-text-secondary leading-relaxed">
                  I absolutely love services like @NIGHTWATCH
                </p>
              </div>

              {/* Card 10 - Simple (short) */}
              <div className="bg-bg-primary border border-border-color rounded-xl p-4 row-span-2">
                <p className="text-sm text-text-secondary leading-relaxed">
                  simple, does a great job, and has a generous free plan for companies just starting out
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full bg-bg-primary border-t border-border-color py-12">
        <div className="max-w-[90%] mx-auto">
          <div className="flex justify-between items-start mb-8">
            {/* Left - Branding */}
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
                <span className="text-xl font-bold text-text-primary">NIGHTWATCH</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                AI-native platform for on-call and incident response with effortless monitoring, status pages, tracing, infrastructure monitoring and log management.
              </p>
            </div>

            {/* Right - Contact & Social */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <a href="tel:+16289003830" className="hover:text-text-primary transition-colors">
                  +1 (628) 900-3830
                </a>
                <a href="mailto:hello@nightwatch.com" className="hover:text-text-primary transition-colors">
                  hello@nightwatch.com
                </a>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                  </svg>
                </a>
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-text-muted hover:text-text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom - Legal Links & Copyright */}
          <div className="flex justify-between items-center pt-8 border-t border-border-color">
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-text-primary transition-colors">GDPR</a>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System status</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>© 2025 NIGHTWATCH, Inc.</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
