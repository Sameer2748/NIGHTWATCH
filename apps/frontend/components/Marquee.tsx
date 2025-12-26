'use client';

interface MarqueeProps {
    children: React.ReactNode;
}

export default function Marquee({ children }: MarqueeProps) {
    return (
        <section className="relative w-full py-8">
            <div className="max-w-[90%] mx-auto relative overflow-hidden">
                {/* Left Blur */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none"></div>

                {/* Right Blur */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none"></div>

                {/* Marquee Container */}
                <div className="flex animate-marquee whitespace-nowrap">
                    {children}
                </div>
            </div>
        </section>
    );
}
