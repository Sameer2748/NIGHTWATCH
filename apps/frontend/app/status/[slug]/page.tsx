"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Page Not Found</h1>
                    <p className="text-gray-600">{error || "This status page does not exist."}</p>
                </div>
            </div>
        )
    }

    const allUp = data.monitors.every(m => m.currentStatus === 'Up')
    const someDown = data.monitors.some(m => m.currentStatus === 'Down')

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${allUp ? 'bg-green-600' : someDown ? 'bg-red-600' : 'bg-yellow-600'
                            }`}>
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {allUp ? 'All services are online' : someDown ? 'Some services are down' : 'Service status unknown'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        Last updated on {format(new Date(), 'MMM dd')} at {format(new Date(), 'hh:mma')} UTC
                    </p>
                </div>
            </div>

            {/* Services */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white border border-gray-200 rounded-lg overflow-visible shadow-sm">
                    {data.monitors.map((monitor, index) => {
                        const isUp = monitor.currentStatus === 'Up'
                        const isExpanded = expandedMonitors.has(monitor.id)
                        const uptimeNum = parseFloat(monitor.uptimePercentage)

                        return (
                            <div key={monitor.id} className={index !== 0 ? 'border-t border-gray-200' : ''}>
                                {/* Monitor Header */}
                                <button
                                    onClick={() => toggleMonitor(monitor.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-900">{monitor.url}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-gray-700">Operational</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-4 bg-gray-50 overflow-visible">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-5 h-5" style={{ color: '#069668' }} />
                                            <span className="font-medium text-gray-900">{monitor.url}</span>
                                            <span className="ml-auto text-sm font-semibold text-gray-700">
                                                {monitor.uptimePercentage}% uptime
                                            </span>
                                        </div>

                                        {/* Uptime Bar */}
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
                                                            {/* Tooltip */}
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
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>90 days ago</span>
                                            <span>Today</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {data.monitors.length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <p>No services are being monitored yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Previous Incidents Section */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Previous incidents</h2>
                <div className="text-center py-12 text-gray-500">
                    <p>No incidents reported in the last 90 days.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-gray-500 border-t border-gray-200 mt-12">
                <p>Powered by <span className="font-semibold text-green-600">NIGHTWATCH</span></p>
            </div>
        </div>
    )
}
