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
        }, 30000)

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
            setMonitor(data)
        } catch (error) {
            console.error("Failed to fetch monitor details:", error)
            if (!silent) toast.error("Failed to load monitor details")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

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

    // Calculate uptime duration - handles clock drift
    const uptimeSeconds = Math.max(0, differenceInSeconds(now, new Date(monitor.timeAdded)))
    const formatDuration = (totalSeconds: number) => {
        // Handle negative durations from clock drift
        const absoluteSeconds = Math.max(0, Math.floor(totalSeconds))

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
    // Format ticks for Recharts
    const chartData = [...monitor.ticks].reverse().map(tick => ({
        time: format(new Date(tick.createdAt), "HH:mm"),
        responseTime: tick.response_time_ms,
        // Real timing breakdown from database
        nameLookup: tick.dns_time_ms || 0,
        connection: tick.tcp_time_ms || 0,
        tls: tick.tls_time_ms || 0,
        // Include ttfb in data transfer/processing time so the graph reflects total time
        dataTransfer: (tick.ttfb_ms || 0) + (tick.download_time_ms || 0),
    }))

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
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
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
                                <CartesianGrid vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 10 }}
                                    unit="ms"
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area stackId="1" type="monotone" dataKey="nameLookup" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLookup)" />
                                <Area stackId="1" type="monotone" dataKey="connection" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConnect)" />
                                <Area stackId="1" type="monotone" dataKey="tls" stroke="#10b981" fillOpacity={1} fill="url(#colorTls)" />
                                <Area stackId="1" type="monotone" dataKey="dataTransfer" stroke="#34d399" fillOpacity={1} fill="url(#colorData)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-6 mt-6 px-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                            <span className="text-xs text-text-muted">Name lookup</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-text-muted">Connection</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-text-muted">TLS handshake</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span className="text-xs text-text-muted">Data transfer</span>
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
