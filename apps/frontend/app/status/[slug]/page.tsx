"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"
import { useTheme } from "@/lib/theme/ThemeContext"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

interface DailyData {
    date: string;
    status: string;
    uptimePercentage: number;
    downMinutes?: number;
}

interface Monitor {
    id: string;
    url: string;
    currentStatus: string;
    uptimePercentage: string;
    dailyData: DailyData[];
}

interface StatusPageData {
    name: string;
    description?: string;
    monitors: Monitor[];
}

export default function PublicStatusPage() {
    const params = useParams()
    const slug = params.slug as string
    const { theme, toggleTheme } = useTheme()
    const [data, setData] = React.useState<StatusPageData | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [expandedMonitors, setExpandedMonitors] = React.useState<Set<string>>(new Set())

    React.useEffect(() => {
        fetchStatusPage()
        const interval = setInterval(fetchStatusPage, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [slug])

    const fetchStatusPage = async () => {
        try {
            const response = await axios.get(`${API_URL}/status-page/public/${slug}`)
            setData(response.data)
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load status page")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMonitor = (id: string) => {
        setExpandedMonitors(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Status Page Not Found</h1>
                    <p className="text-text-secondary">{error || "This status page does not exist."}</p>
                </div>
            </div>
        )
    }

    const allUp = data.monitors.every(m => m.currentStatus === 'Up')
    const someDown = data.monitors.some(m => m.currentStatus === 'Down')

    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Navbar */}
            <nav className="border-b border-border-color bg-bg-primary">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo - Left */}
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-text-primary" viewBox="0 0 256 256" fill="none">
                            <path d="M 128 0 C 198.692 0 256 57.308 256 128 C 256 198.692 198.692 256 128 256 C 57.308 256 0 198.692 0 128 C 0 57.308 57.308 0 128 0 Z M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.019 74.98 224 128 224 C 181.019 224 224 181.019 224 128 C 224 74.98 181.019 32 128 32 Z M 128 112 C 136.837 112 144 119.163 144 128 C 144 136.837 136.837 144 128 144 C 119.163 144 112 136.837 112 128 C 112 119.163 119.163 112 128 112 Z" fill="currentColor" />
                        </svg>
                        <span className="text-lg font-bold text-text-primary">NIGHTWATCH</span>
                    </div>

                    {/* Theme Switcher - Right */}
                    <button
                        onClick={() => {
                            const audio = new Audio('/audio/infinity-castle-opening.mp3');
                            audio.play().catch(err => console.log('Audio play failed:', err));
                            toggleTheme();
                        }}
                        className="p-2 rounded-lg hover:bg-card-bg transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Status Header */}
            <div className="bg-bg-primary border-b border-border-color">
                <div className="max-w-4xl mx-auto px-6 py-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${allUp ? 'bg-green-600' : someDown ? 'bg-red-600' : 'bg-yellow-600'
                            }`}>
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        {allUp ? 'All services are online' : someDown ? 'Some services are down' : 'Service status unknown'}
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Last updated on {format(new Date(), 'MMM dd')} at {format(new Date(), 'hh:mma')} UTC
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-card-bg border border-border-color rounded-lg overflow-visible shadow-sm">
                    {data.monitors.map((monitor, index) => {
                        const isUp = monitor.currentStatus === 'Up'
                        const isExpanded = expandedMonitors.has(monitor.id)
                        const uptimeNum = parseFloat(monitor.uptimePercentage)

                        return (
                            <div key={monitor.id} className={index !== 0 ? 'border-t border-border-color' : ''}>
                                <button
                                    onClick={() => toggleMonitor(monitor.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-bg-primary transition-colors"
                                >
                                    <span className="font-medium text-text-primary">{monitor.url}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-text-secondary">Operational</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-text-muted" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-text-muted" />
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-4 bg-bg-primary overflow-visible">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-5 h-5" style={{ color: '#069668' }} />
                                            <span className="font-medium text-text-primary">{monitor.url}</span>
                                            <span className="ml-auto text-sm font-semibold text-text-secondary">
                                                {monitor.uptimePercentage}% uptime
                                            </span>
                                        </div>

                                        <div className="mb-2 relative">
                                            <div className="flex gap-[2px] h-8 rounded overflow-visible">
                                                {monitor.dailyData?.map((day, i) => {
                                                    const isUp = day.status === 'Up'
                                                    const isDegraded = day.status === 'Degraded'
                                                    const isDown = day.status === 'Down'
                                                    const dateStr = format(new Date(day.date), 'MMM dd, yyyy')

                                                    // Color logic: green for Up, orange for Degraded, red for Down
                                                    const bgColor = isUp ? '#069668' : isDegraded ? '#f59e0b' : '#b91c1b'
                                                    const hoverColor = isUp ? '#047857' : isDegraded ? '#d97706' : '#991b1b'

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 cursor-pointer transition-all relative group ${i === 0 ? 'rounded-l' : ''
                                                                } ${i === monitor.dailyData.length - 1 ? 'rounded-r' : ''
                                                                }`}
                                                            style={{ backgroundColor: bgColor }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                                                        >
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {isUp ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-4 h-4" style={{ color: '#069668' }} />
                                                                                <span className="font-medium text-gray-900">Operational</span>
                                                                            </>
                                                                        ) : isDegraded ? (
                                                                            <>
                                                                                <AlertCircle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                                                                <span className="font-medium text-gray-900">Degraded</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <XCircle className="w-4 h-4" style={{ color: '#b91c1b' }} />
                                                                                <span className="font-medium text-gray-900">Downtime</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {(isDown || isDegraded) && day.downMinutes && (
                                                                        <p className="text-xs text-gray-500 mb-1">
                                                                            {isDown ? 'Down' : 'Degraded'} for {day.downMinutes} minutes
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500">{dateStr}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-text-muted">
                                            <span>90 days ago</span>
                                            <span>Today</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {data.monitors.length === 0 && (
                        <div className="px-6 py-12 text-center text-text-muted">
                            <p>No services are being monitored yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Previous incidents</h2>
                <div className="text-center py-12 text-text-muted">
                    <p>No incidents reported in the last 90 days.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-text-muted border-t border-border-color mt-12">
                <p>Powered by <span className="font-semibold text-green-600">NIGHTWATCH</span></p>
            </div>
        </div>
    )
}
