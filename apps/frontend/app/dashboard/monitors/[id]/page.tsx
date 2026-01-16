'use client'

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Activity,
    ArrowLeft,
    Bell,
    Clock,
    Settings,
    Pause,
    Play,
    AlertCircle,
    ChevronDown,
    Globe,
    CheckCircle2
} from "lucide-react"
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts"
import { format, differenceInSeconds, startOfDay, subDays } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    getMonitorDetails,
    MonitorDetails,
    WebsiteTick
} from "@/lib/api/monitors"
import { tokenManager } from "@/lib/auth/tokenManager"

export default function MonitorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [monitor, setMonitor] = React.useState<MonitorDetails | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [timeRange, setTimeRange] = React.useState<"day" | "week" | "month">("day")
    const [selectedRegion, setSelectedRegion] = React.useState<string>("india-region-id")

    const [now, setNow] = React.useState(new Date())

    const regions = [
        { id: 'india-region-id', name: 'India', flag: '🇮🇳' },
        { id: 'usa-region-id', name: 'USA', flag: '🇺🇸' }
    ]


    React.useEffect(() => {
        if (id) {
            fetchDetails()
        }
    }, [id, selectedRegion])

    // Auto-refresh every 30 seconds for live updates
    React.useEffect(() => {
        if (!id) return;

        const interval = setInterval(() => {
            fetchDetails(true)
        }, 5000)

        return () => clearInterval(interval)
    }, [id, selectedRegion])

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])


    const fetchDetails = async (silent = false) => {
        const token = tokenManager.getToken()
        if (!token) {
            router.push("/signin")
            return
        }

        try {
            if (!silent) setIsLoading(true)
            const data = await getMonitorDetails(id, token, selectedRegion)
            console.log("Monitor Data Received:", {
                url: data.url,
                ticksCount: data.ticks?.length,
                latestTicks: data.ticks?.slice(0, 5).map(t => ({ time: t.createdAt, status: t.status }))
            })
            setMonitor(data)
        } catch (error) {
            console.error("Failed to fetch monitor details:", error)
            if (!silent) toast.error("Failed to load monitor details")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    // Filter ticks based on selected time range
    const filteredTicks = React.useMemo(() => {
        if (!monitor?.ticks || monitor.ticks.length === 0) return []

        const now = new Date()
        let cutoff = subDays(now, 1) // Default 24h

        if (timeRange === 'week') cutoff = subDays(now, 7)
        if (timeRange === 'month') cutoff = subDays(now, 30)

        return [...monitor.ticks]
            .filter(t => new Date(t.createdAt) > cutoff)
            .reverse()
    }, [monitor?.ticks, timeRange])

    const chartData = React.useMemo(() => {
        if (!filteredTicks || filteredTicks.length === 0) return []

        if (timeRange === 'day') {
            return filteredTicks.map(tick => {
                const date = new Date(tick.createdAt)
                return {
                    timestamp: date.getTime(),
                    timeStr: format(date, "HH:mm"),
                    fullDate: format(date, "MMM d, HH:mm:ss"),
                    responseTime: tick.response_time_ms,
                    nameLookup: tick.dns_time_ms || 0,
                    connection: tick.tcp_time_ms || 0,
                    tls: tick.tls_time_ms || 0,
                    dataTransfer: (tick.ttfb_ms || 0) + (tick.download_time_ms || 0),
                    isAggregated: false
                }
            })
        }

        // Aggregate by day for week/month
        const groups: Record<string, any[]> = {}
        filteredTicks.forEach(tick => {
            const date = new Date(tick.createdAt)
            const dayKey = format(date, "yyyy-MM-dd")
            if (!groups[dayKey]) groups[dayKey] = []
            groups[dayKey].push(tick)
        })

        return Object.keys(groups).sort().map(dayKey => {
            const dayTicks = groups[dayKey]
            if (!dayTicks || dayTicks.length === 0) return null

            const firstTick = dayTicks[0]
            const date = new Date(firstTick.createdAt)
            const count = dayTicks.length

            const avg = (key: string) => Math.round(dayTicks.reduce((acc, t: any) => acc + (t[key] || 0), 0) / count)

            return {
                timestamp: startOfDay(date).getTime(),
                timeStr: format(date, "MMM d"),
                fullDate: format(date, "MMMM d, yyyy"),
                responseTime: avg('response_time_ms'),
                nameLookup: avg('dns_time_ms'),
                connection: avg('tcp_time_ms'),
                tls: avg('tls_time_ms'),
                dataTransfer: Math.round(dayTicks.reduce((acc, t: any) => acc + (t.ttfb_ms || 0) + (t.download_time_ms || 0), 0) / count),
                isAggregated: true,
                tickCount: count
            }
        }).filter((item): item is any => item !== null)
    }, [filteredTicks, timeRange])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-primary"></div>
            </div>
        )
    }

    if (!monitor) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="mx-auto h-12 w-12 text-text-muted mb-4" />
                <h2 className="text-xl font-semibold mb-2">Monitor not found</h2>
                <Button onClick={() => router.push("/dashboard/monitors")}>
                    Back to Monitors
                </Button>
            </div>
        )
    }

    const lastTick = monitor.ticks[0]
    const status = lastTick?.status || "Unknown"

    // Calculate uptime duration - handles clock drift and last incident resolution
    let uptimeSeconds = 0
    if (status === 'Up') {
        const lastResolvedIncident = monitor.incidents?.find(inc => inc.status === 'RESOLVED')
        const startTime = lastResolvedIncident?.resolvedAt
            ? new Date(lastResolvedIncident.resolvedAt)
            : new Date(monitor.timeAdded)
        uptimeSeconds = Math.max(0, differenceInSeconds(now, startTime))
    }
    const formatDuration = (totalSeconds: number) => {
        // Handle negative durations from clock drift
        const absoluteSeconds = Math.max(0, Math.floor(totalSeconds))

        if (absoluteSeconds < 5) return "Just now"
        if (absoluteSeconds < 60) return `${absoluteSeconds} sec`

        const totalMinutes = Math.floor(absoluteSeconds / 60)
        const seconds = absoluteSeconds % 60

        if (totalMinutes < 60) return `${totalMinutes} min ${seconds} sec`

        const totalHours = Math.floor(absoluteSeconds / 3600)
        const minutes = Math.floor((absoluteSeconds % 3600) / 60)

        if (totalHours < 24) return `${totalHours} hours ${minutes} mins ${seconds} sec`

        const days = Math.floor(absoluteSeconds / 86400)
        const hours = Math.floor((absoluteSeconds % 86400) / 3600)

        if (days < 365) return `${days} days ${hours} hours ${minutes} mins`

        const years = Math.floor(days / 365)
        const remainingDays = days % 365
        return `${years} year${years > 1 ? 's' : ''} ${remainingDays} days`
    }


    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            const total = payload.reduce((acc: number, entry: any) => acc + (entry.value || 0), 0)
            return (
                <div className="bg-[#1e293b]/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl min-w-[220px]">
                    <div className="mb-3 border-b border-white/10 pb-2">
                        <p className="text-white font-black text-lg leading-none mb-1">{data.timeStr}</p>
                        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{data.fullDate}</p>
                        {data.isAggregated && (
                            <Badge variant="outline" className="mt-2 text-[9px] h-4 bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                                AVG OF {data.tickCount} CHECKS
                            </Badge>
                        )}
                    </div>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                                    <span className="text-slate-400 text-[11px] capitalize">
                                        {entry.name.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                </div>
                                <span className="text-white text-[11px] font-mono">{entry.value}ms</span>
                            </div>
                        ))}
                        <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between gap-4">
                            <span className="text-white text-xs font-bold uppercase tracking-tight">
                                {data.isAggregated ? 'AVG RESPONSE' : 'RESPONSE TIME'}
                            </span>
                            <span className="text-emerald-400 text-xs font-mono font-bold">{total}ms</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs / Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <button
                        onClick={() => router.push("/dashboard/monitors")}
                        className="hover:text-text-primary transition-colors flex items-center gap-1 shrink-0"
                    >
                        <Globe className="w-4 h-4" />
                        Monitors
                    </button>
                    <span className="text-text-muted/50">/</span>
                    <span className="text-text-secondary truncate max-w-[200px] md:max-w-md">{monitor.url}</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4 min-w-0 max-w-full overflow-hidden">
                        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${status === 'Up' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : status === 'Down' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.4)]'}`}></div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary truncate" title={monitor.url}>
                                {monitor.url}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${status === 'Up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {status}
                                </Badge>
                                <span className="text-xs text-text-muted">• Checked every 3 minutes</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8">
                            <Bell className="w-3.5 h-3.5" />
                            Send test alert
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Incidents
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8">
                            <Pause className="w-3.5 h-3.5" />
                            Pause
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8">
                            <Settings className="w-3.5 h-3.5" />
                            Configure
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card-bg border-border-color shadow-sm">
                    <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Currently up for</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-xl font-bold text-text-primary">{formatDuration(uptimeSeconds)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card-bg border-border-color shadow-sm">
                    <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Last checked at</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-xl font-bold text-text-primary">
                            {lastTick ? `${formatDuration(differenceInSeconds(now, new Date(lastTick.createdAt)))} ago` : "N/A"}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card-bg border-border-color shadow-sm">
                    <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Incidents</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-xl font-bold text-text-primary">{monitor.incidents?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Response Times Chart */}
            <Card className="bg-card-bg border-border-color overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border-color px-6 py-4">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-base font-semibold">Response times</CardTitle>
                        <div className="relative">
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="flex items-center gap-2 px-3 py-1 bg-bg-primary rounded-md border border-border-color cursor-pointer hover:border-button-primary transition-colors text-sm font-medium appearance-none pr-8"
                            >
                                {regions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.flag} {region.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex bg-bg-primary p-1 rounded-lg border border-border-color">
                        {['Day', 'Week', 'Month'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range.toLowerCase() as any)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === range.toLowerCase()
                                    ? 'bg-card-bg text-text-primary shadow-sm'
                                    : 'text-text-muted hover:text-text-secondary'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[320px] w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{
                            width: timeRange === 'day' ? `${Math.max(100, chartData.length * 0.8)}%` : '100%',
                            minWidth: '100%',
                            height: '100%'
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLookup" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorConnect" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="#ffffff05" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        type="number"
                                        domain={['auto', 'auto']}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                        dy={10}
                                        tickFormatter={(unixTime) => {
                                            const date = new Date(unixTime)
                                            if (timeRange === 'day') return format(date, "HH:mm")
                                            return format(date, "MMM d")
                                        }}
                                        interval="preserveStart"
                                        minTickGap={timeRange === 'day' ? 20 : 50}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                        unit="ms"
                                        dx={-10}
                                        domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.2))]}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
                                    />
                                    <Area stackId="1" type="monotone" dataKey="nameLookup" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLookup)" isAnimationActive={false} />
                                    <Area stackId="1" type="monotone" dataKey="connection" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConnect)" isAnimationActive={false} />
                                    <Area stackId="1" type="monotone" dataKey="tls" stroke="#10b981" fillOpacity={1} fill="url(#colorTls)" isAnimationActive={false} />
                                    <Area stackId="1" type="monotone" dataKey="dataTransfer" stroke="#34d399" fillOpacity={1} fill="url(#colorData)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 mt-6 px-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"></div>
                            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">DNS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">TCP</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">TLS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"></div>
                            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">TRANSFER</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Availability Table */}
            <Card className="bg-card-bg border-border-color">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border-color">
                            <TableHead className="text-text-muted font-medium w-[250px]">Time period</TableHead>
                            <TableHead className="text-text-muted font-medium">Availability</TableHead>
                            <TableHead className="text-text-muted font-medium">Downtime</TableHead>
                            <TableHead className="text-text-muted font-medium">Incidents</TableHead>
                            <TableHead className="text-text-muted font-medium">Longest incident</TableHead>
                            <TableHead className="text-text-muted font-medium text-right">Avg. incident</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            { period: "Today", avail: "100.0000%", down: "none", inc: "0", long: "none", avg: "none" },
                            { period: "Last 7 days", avail: "100.0000%", down: "none", inc: "0", long: "none", avg: "none" },
                            { period: "Last 30 days", avail: "100.0000%", down: "none", inc: "0", long: "none", avg: "none" },
                            { period: "Last 365 days", avail: "100.0000%", down: "none", inc: "0", long: "none", avg: "none" },
                            { period: "All time (Last 267 days)", avail: "100.0000%", down: "none", inc: "0", long: "none", avg: "none" },
                        ].map((row, i) => (
                            <TableRow key={i} className="hover:bg-white/5 border-border-color">
                                <TableCell className="font-medium text-text-primary">{row.period}</TableCell>
                                <TableCell className="text-text-primary font-bold">{row.avail}</TableCell>
                                <TableCell className="text-text-muted">{row.down}</TableCell>
                                <TableCell className="text-text-primary">{row.inc}</TableCell>
                                <TableCell className="text-text-muted">{row.long}</TableCell>
                                <TableCell className="text-text-muted text-right">{row.avg}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Footer Help */}
            <div className="flex justify-center pt-8">
                <div className="flex items-center gap-2 px-6 py-3 bg-[#1e293b]/50 rounded-full border border-border-color text-sm text-text-muted">
                    <AlertCircle className="w-4 h-4 text-button-primary" />
                    <span>Need help? Let us know at</span>
                    <a href="mailto:hello@betterstack.com" className="text-button-primary hover:underline">hello@betterstack.com</a>
                </div>
            </div>
        </div >
    )
}
