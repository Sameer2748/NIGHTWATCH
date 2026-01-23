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
    CheckCircle2,
    ShieldCheck,
    AlertTriangle
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
import { API_BASE_URL, getMonitorDetails, MonitorDetails, WebsiteTick, acknowledgeIncident, sendTestAlert, toggleMonitorPause } from "@/lib/api/monitors"
import { tokenManager } from "@/lib/auth/tokenManager"

export default function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    const router = useRouter()

    const [monitor, setMonitor] = React.useState<MonitorDetails | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [selectedRegion, setSelectedRegion] = React.useState<string>("india-region-id")
    const [timeRange, setTimeRange] = React.useState<'day' | 'week' | 'month'>('day')
    const [isAcknowledging, setIsAcknowledging] = React.useState(false)
    const [isSendingTestAlert, setIsSendingTestAlert] = React.useState(false)
    const [isPausing, setIsPausing] = React.useState(false)

    const [now, setNow] = React.useState(new Date())

    const regions = [
        { id: 'india-region-id', name: 'India', flag: '🇮🇳' },
        { id: 'usa-region-id', name: 'USA', flag: '🇺🇸' }
    ]

    // Find ongoing incident for this region
    const ongoingIncident = React.useMemo(() => {
        return monitor?.incidents?.find(inc => inc.status === "ONGOING" && inc.region_id === selectedRegion);
    }, [monitor?.incidents, selectedRegion]);

    const handleAcknowledge = async () => {
        if (!ongoingIncident) return;
        setIsAcknowledging(true);
        try {
            const token = tokenManager.getToken();
            if (!token) throw new Error("No token");
            await acknowledgeIncident(ongoingIncident.id, token);
            toast.success("Incident acknowledged. Escalation halted.");
            // Refresh data
            const updated = await getMonitorDetails(id, token, selectedRegion);
            setMonitor(updated);
        } catch (err) {
            toast.error("Failed to acknowledge incident");
        } finally {
            setIsAcknowledging(false);
        }
    }

    const handleTestAlert = async () => {
        setIsSendingTestAlert(true);
        try {
            const token = tokenManager.getToken();
            if (!token) throw new Error("No token");
            await sendTestAlert(id, token);
            toast.success("Test alert sent successfully!");
        } catch (err) {
            console.error("Failed to send test alert:", err);
            toast.error("Failed to send test alert");
        } finally {
            setIsSendingTestAlert(false);
        }
    }

    const handlePause = async () => {
        if (!monitor) return;
        setIsPausing(true);
        try {
            const token = tokenManager.getToken();
            if (!token) throw new Error("No token");

            const newStatus = !monitor.paused;
            await toggleMonitorPause(id, newStatus, token);

            toast.success(newStatus ? "Monitor paused" : "Monitor resumed");
            setMonitor(prev => prev ? { ...prev, paused: newStatus } : null);
        } catch (err) {
            console.error("Failed to toggle pause:", err);
            toast.error("Failed to update monitor status");
        } finally {
            setIsPausing(false);
        }
    }


    // Initial fetch
    React.useEffect(() => {
        if (id) {
            fetchDetails()
        }
    }, [id, selectedRegion])

    // Real-time updates via SSE
    React.useEffect(() => {
        if (!id) return;

        // Ensure we handle URL correctly (strip trailing slash if present)
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const API_STREAM_URL = `${baseUrl}/website/${id}/stream`;

        console.log("[SSE] Connecting to:", API_STREAM_URL);
        const eventSource = new EventSource(API_STREAM_URL);

        eventSource.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);
                console.log("[SSE] Update Received:", update);

                setMonitor(prev => {
                    if (!prev) return prev;

                    if (update.type === 'TICK') {
                        const newTick = update.data;
                        const alreadyExists = prev.ticks?.some(t => t.id === newTick.id);
                        if (alreadyExists) return prev;

                        const updatedTicks = [newTick, ...(prev.ticks || [])].slice(0, 1000);
                        return { ...prev, ticks: updatedTicks };
                    }

                    if (update.type === 'INCIDENT_CREATED') {
                        const newInc = update.data;
                        const alreadyExists = prev.incidents?.some(i => i.id === newInc.id);
                        if (alreadyExists) return prev;

                        toast.error(`Website Down! New incident in ${newInc.region_id}`);
                        return {
                            ...prev,
                            incidents: [newInc, ...(prev.incidents || [])]
                        };
                    }

                    if (update.type === 'INCIDENT_RESOLVED') {
                        const resolvedInc = update.data;
                        toast.success(`Incident Resolved! Website is back up.`);
                        return {
                            ...prev,
                            incidents: prev.incidents?.map(i => i.id === resolvedInc.id ? resolvedInc : i)
                        };
                    }

                    return prev;
                });
            } catch (err) {
                console.error("[SSE] Failed to parse message:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("[SSE] Connection Error:", err);
            // eventSource will try to reconnect automatically by default
        };

        return () => {
            console.log("[SSE] Closing connection");
            eventSource.close();
        };
    }, [id]);

    // Fallback refresh every 60 seconds just in case SSE fails or for status pages sync
    React.useEffect(() => {
        if (!id) return;
        const interval = setInterval(() => {
            fetchDetails(true)
        }, 60000)
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
                <div className="bg-card-bg/95 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl min-w-[220px]">
                    <div className="mb-3 border-b border-border pb-2">
                        <p className="text-text-primary font-black text-lg leading-none mb-1">{data.timeStr}</p>
                        <p className="text-text-secondary text-[10px] font-medium uppercase tracking-wider">{data.fullDate}</p>
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
                                    <span className="text-text-secondary text-[11px] capitalize">
                                        {entry.name.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                </div>
                                <span className="text-text-primary text-[11px] font-mono">{entry.value}ms</span>
                            </div>
                        ))}
                        <div className="pt-2 mt-1 border-t border-border flex items-center justify-between gap-4">
                            <span className="text-text-primary text-xs font-bold uppercase tracking-tight">
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
        <div className="space-y-6 max-w-full overflow-x-hidden">
            {/* Breadcrumbs / Header */}
            <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
                {/* Ongoing Incident Alert */}
                {ongoingIncident && (
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border animate-in slide-in-from-top-4 duration-300 ${ongoingIncident.acknowledgedAt
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg mt-0.5 ${ongoingIncident.acknowledgedAt ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                                {ongoingIncident.acknowledgedAt ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">
                                    {ongoingIncident.acknowledgedAt ? "Incident Acknowledged" : "Active Incident Region: India"}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {ongoingIncident.acknowledgedAt
                                        ? `Acknowledged at ${format(new Date(ongoingIncident.acknowledgedAt), 'HH:mm:ss')}. Escalation halted.`
                                        : `System is currently escalating alerts. Website is unreachable from ${selectedRegion === 'india-region-id' ? 'India' : 'USA'}.`}
                                </p>
                            </div>
                        </div>
                        {!ongoingIncident.acknowledgedAt && (
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 px-6 rounded-lg shadow-lg shadow-red-500/20"
                                onClick={handleAcknowledge}
                                disabled={isAcknowledging}
                            >
                                {isAcknowledging ? "Acknowledging..." : "Acknowledge Incident"}
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4 pt-4 w-full">
                    <div className="flex items-center gap-2 text-sm text-text-muted w-full min-w-0">
                        <button
                            onClick={() => router.push("/dashboard/monitors")}
                            className="hover:text-text-primary transition-colors flex items-center gap-1 shrink-0"
                        >
                            <Globe className="w-4 h-4" />
                            Monitors
                        </button>
                        <span className="text-text-muted/50 shrink-0">/</span>
                        <span className="text-text-secondary truncate min-w-0 flex-1">{monitor.url}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 w-full max-w-full">
                        <div className="flex items-center gap-4 min-w-0 flex-1 max-w-full overflow-hidden">
                            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${status === 'Up' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : status === 'Down' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.4)]'}`}></div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary truncate pr-4" title={monitor.url}>
                                    {monitor.url}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${status === 'Up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {status}
                                    </Badge>
                                    <span className="text-xs text-text-muted">• Checked every 3 minutes</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8"
                                onClick={handleTestAlert}
                                disabled={isSendingTestAlert}
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {isSendingTestAlert ? "Sending..." : "Send test alert"}
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Incidents
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-border-color bg-card-bg hover:bg-white/5 text-xs h-8"
                                onClick={handlePause}
                                disabled={isPausing}
                            >
                                {monitor.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                {isPausing ? "Updating..." : (monitor.paused ? "Resume" : "Pause")}
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
                <Card className="bg-card-bg border-border-color overflow-hidden min-w-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border-color px-6 py-4">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-base font-semibold">Response times</CardTitle>
                            <div className="relative">
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="flex items-center gap-2 px-3 py-1 bg-transparent rounded-md border border-border cursor-pointer hover:border-button-primary transition-colors text-sm font-medium appearance-none pr-8"
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
                        <div className="flex bg-bg-primary p-1 rounded-lg border border-border">
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
                    <CardContent className="p-6 max-w-full relative">
                        {/* Chart Container - Relative + Absolute to strictly contain Recharts */}
                        <div className="h-[320px] w-full relative overflow-hidden rounded-lg flex border border-border/10">
                            {/* Fixed Y-Axis Left Column */}
                            <div className="w-[60px] h-full shrink-0 relative bg-card-bg z-10 border-r border-border/50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <XAxis
                                            dataKey="timestamp"
                                            height={30}
                                            tick={false}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                            dx={-5}
                                            width={60}
                                            tickFormatter={(value) => {
                                                if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
                                                return `${value}ms`;
                                            }}
                                            domain={[0, (dataMax: number) => {
                                                const safetyBuffer = dataMax > 0 ? dataMax * 1.15 : 100;
                                                return Math.ceil(safetyBuffer / 10) * 10;
                                            }]}
                                        />
                                        {/* Invisible areas to force same scale */}
                                        <Area stackId="1" type="monotone" dataKey="nameLookup" stroke="none" fill="none" />
                                        <Area stackId="1" type="monotone" dataKey="connection" stroke="none" fill="none" />
                                        <Area stackId="1" type="monotone" dataKey="tls" stroke="none" fill="none" />
                                        <Area stackId="1" type="monotone" dataKey="dataTransfer" stroke="none" fill="none" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Scrollable Chart Body */}
                            <div className="flex-1 h-full overflow-x-auto custom-scrollbar relative bg-card-bg">
                                <div style={{
                                    width: timeRange === 'day' ? `${Math.max(100, chartData.length * 0.8)}%` : '100%',
                                    height: '100%',
                                    minHeight: '300px'
                                }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
                                                height={30}
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
                                                hide
                                                domain={[0, (dataMax: number) => {
                                                    const safetyBuffer = dataMax > 0 ? dataMax * 1.15 : 100;
                                                    return Math.ceil(safetyBuffer / 10) * 10;
                                                }]}
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

                {/* Escalation Policy Section */}
                <Card className="bg-card-bg border-border-color overflow-hidden min-w-0 shadow-sm">
                    <CardHeader className="border-b border-border-color px-6 py-4">
                        <CardTitle className="text-base font-semibold">On-Call Escalation Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {monitor.escalationSteps && monitor.escalationSteps.length > 0 ? (
                            <div className="space-y-4">
                                {(() => {
                                    const steps = [...monitor.escalationSteps].sort((a, b) => a.order - b.order);
                                    return steps.map((step, idx) => (
                                        <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg bg-bg-primary/50 border border-border-color relative">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-button-primary/10 border border-button-primary/20 flex items-center justify-center text-button-primary font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] h-4 bg-button-primary/5 text-button-primary border-button-primary/20">
                                                        {step.type}
                                                    </Badge>
                                                    <span className="text-sm font-medium text-text-primary truncate">
                                                        {step.value === 'OWNER' ? 'Account Email' : step.value}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {step.type === 'CALL' ? 'Automated voice call alert' : step.type === 'SMS' ? 'Short message notification' : 'Detailed email alert'}
                                                </p>
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className="absolute -bottom-4 left-7 w-[2px] h-4 bg-border-color/30"></div>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-text-muted">
                                <p className="text-sm">No escalation policy defined.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Availability Table */}
                <Card className="bg-card-bg border-border-color overflow-hidden min-w-0 shadow-sm">
                    <div className="w-full overflow-x-auto">
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
                                {(() => {
                                    const calculateRowStats = (days: number | null) => {
                                        const startTime = days ? subDays(now, days) : new Date(monitor.timeAdded);
                                        const actualStartTime = startTime > new Date(monitor.timeAdded) ? startTime : new Date(monitor.timeAdded);

                                        const periodIncidents = monitor.incidents?.filter(inc => {
                                            const incStart = new Date(inc.startedAt);
                                            const incEnd = inc.resolvedAt ? new Date(inc.resolvedAt) : now;
                                            return incEnd > actualStartTime;
                                        }) || [];

                                        const totalDowntimeSeconds = periodIncidents.reduce((acc, inc) => {
                                            const start = new Date(inc.startedAt);
                                            const end = inc.resolvedAt ? new Date(inc.resolvedAt) : now;
                                            const effectiveStart = start > actualStartTime ? start : actualStartTime;
                                            return acc + differenceInSeconds(end, effectiveStart);
                                        }, 0);

                                        const totalPeriodSeconds = Math.max(1, differenceInSeconds(now, actualStartTime));
                                        const uptimePercentage = Math.max(0, Math.min(100, ((totalPeriodSeconds - totalDowntimeSeconds) / totalPeriodSeconds) * 100));

                                        const formatSecs = (s: number) => {
                                            if (s <= 0) return "none";
                                            if (s < 60) return `${Math.floor(s)}s`;
                                            const m = Math.floor(s / 60);
                                            if (m < 60) return `${m}m ${Math.floor(s % 60)}s`;
                                            const h = Math.floor(m / 60);
                                            const mins = m % 60;
                                            return `${h}h ${mins}m`;
                                        };

                                        const maxIncident = periodIncidents.length > 0
                                            ? Math.max(...periodIncidents.map(inc => {
                                                const s = new Date(inc.startedAt);
                                                const e = inc.resolvedAt ? new Date(inc.resolvedAt) : now;
                                                const effectiveStart = s > actualStartTime ? s : actualStartTime;
                                                return differenceInSeconds(e, effectiveStart);
                                            }))
                                            : 0;

                                        const avgIncident = periodIncidents.length > 0 ? totalDowntimeSeconds / periodIncidents.length : 0;

                                        return {
                                            avail: `${uptimePercentage.toFixed(4)}%`,
                                            down: totalDowntimeSeconds > 0 ? formatSecs(totalDowntimeSeconds) : "none",
                                            inc: periodIncidents.length.toString(),
                                            long: maxIncident > 0 ? formatSecs(maxIncident) : "none",
                                            avg: avgIncident > 0 ? formatSecs(avgIncident) : "none"
                                        };
                                    };

                                    const daysSinceAdded = Math.max(1, Math.ceil(differenceInSeconds(now, new Date(monitor.timeAdded)) / 86400));

                                    return [
                                        { period: "Today", ...calculateRowStats(1) },
                                        { period: "Last 7 days", ...calculateRowStats(7) },
                                        { period: "Last 30 days", ...calculateRowStats(30) },
                                        { period: "Last 365 days", ...calculateRowStats(365) },
                                        { period: `All time (Last ${daysSinceAdded} days)`, ...calculateRowStats(null) },
                                    ].map((row, i) => (
                                        <TableRow key={i} className="hover:bg-hover-bg/30 border-border-color">
                                            <TableCell className="font-medium text-text-primary whitespace-nowrap">{row.period}</TableCell>
                                            <TableCell className="text-text-primary font-bold">{row.avail}</TableCell>
                                            <TableCell className="text-text-muted">{row.down}</TableCell>
                                            <TableCell className="text-text-primary">{row.inc}</TableCell>
                                            <TableCell className="text-text-muted">{row.long}</TableCell>
                                            <TableCell className="text-text-muted text-right">{row.avg}</TableCell>
                                        </TableRow>
                                    ));
                                })()}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Footer Help */}
                <div className="flex justify-center pt-8">
                    <div className="flex items-center gap-2 px-6 py-3 bg-card-bg border border-border rounded-full text-sm shadow-sm group hover:border-button-primary/30 transition-all">
                        <AlertCircle className="w-4 h-4 text-button-primary" />
                        <span className="text-text-secondary">Need help? Let us know at</span>
                        <a href="mailto:mrao27488@gmail.com" className="text-button-primary font-semibold hover:underline decoration-2 underline-offset-4">
                            mrao27488@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
