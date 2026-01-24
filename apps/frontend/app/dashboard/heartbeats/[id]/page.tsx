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
    AlertTriangle,
    Heart
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

export default function HeartbeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    const router = useRouter()

    const [monitor, setMonitor] = React.useState<MonitorDetails | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
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

            toast.success(newStatus ? "Heartbeat paused" : "Heartbeat resumed");
            setMonitor(prev => prev ? { ...prev, paused: newStatus } : null);
        } catch (err) {
            console.error("Failed to toggle pause:", err);
            toast.error("Failed to update status");
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

    React.useEffect(() => {
        if (!id) return;

        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const API_STREAM_URL = `${baseUrl}/website/${id}/stream`;

        const eventSource = new EventSource(API_STREAM_URL);

        eventSource.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);

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

                        toast.error(`Heartbeat Missed! New incident in ${newInc.region_id}`);
                        return {
                            ...prev,
                            incidents: [newInc, ...(prev.incidents || [])]
                        };
                    }

                    if (update.type === 'INCIDENT_RESOLVED') {
                        const resolvedInc = update.data;
                        toast.success(`Heartbeat Recovered!`);
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

        return () => {
            eventSource.close();
        };
    }, [id]);

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
                <h2 className="text-xl font-semibold mb-2">Heartbeat not found</h2>
                <Button onClick={() => router.push("/dashboard/heartbeats")}>
                    Back to Heartbeats
                </Button>
            </div>
        )
    }

    const lastTick = monitor.ticks[0]
    const status = lastTick?.status || "Unknown"

    let uptimeSeconds = 0
    if (status === 'Up') {
        const lastResolvedIncident = monitor.incidents?.find(inc => inc.status === 'RESOLVED')
        const startTime = lastResolvedIncident?.resolvedAt
            ? new Date(lastResolvedIncident.resolvedAt)
            : new Date(monitor.timeAdded)
        uptimeSeconds = Math.max(0, differenceInSeconds(now, startTime))
    }
    const formatDuration = (totalSeconds: number) => {
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
        return `${days} days ${hours} hours`
    }


    return (
        <div className="space-y-6 max-w-full overflow-x-hidden">
            <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
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
                                    {ongoingIncident.acknowledgedAt ? "Incident Acknowledged" : "Heartbeat Missed"}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {ongoingIncident.acknowledgedAt
                                        ? `Acknowledged at ${format(new Date(ongoingIncident.acknowledgedAt), 'HH:mm:ss')}.`
                                        : `We stopped receiving heartbeats. Expected every ${monitor.period}s.`}
                                </p>
                            </div>
                        </div>
                        {!ongoingIncident.acknowledgedAt && (
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 px-6 rounded-lg shadow-lg shadow-red-500/20"
                                onClick={handleAcknowledge}
                                disabled={isAcknowledging}
                            >
                                {isAcknowledging ? "Acknowledging..." : "Acknowledge"}
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4 pt-4 w-full">
                    <div className="flex items-center gap-2 text-sm text-text-muted w-full min-w-0">
                        <button
                            onClick={() => router.push("/dashboard/heartbeats")}
                            className="hover:text-text-primary transition-colors flex items-center gap-1 shrink-0"
                        >
                            <Activity className="w-4 h-4" />
                            Heartbeats
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
                                    <span className="text-xs text-text-muted">• Expected every {monitor.period}s</span>
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

                <Card className="bg-card-bg border-border-color shadow-sm">
                    <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-button-primary" />
                            <CardTitle className="text-base font-semibold">Heartbeat Configuration</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <p className="text-sm text-text-muted">
                                To keep this monitor <strong>Up</strong>, send an HTTP request to the URL below every <strong>{monitor.period} seconds</strong>.
                                <br />
                                We will wait an extra <strong>{monitor.grace_period} seconds</strong> before marking it as Down.
                            </p>
                            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-border">
                                <code className="flex-1 px-2 font-mono text-xs text-button-primary truncate">
                                    {`${API_BASE_URL}/heartbeat/${monitor.id}`}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs hover:bg-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${API_BASE_URL}/heartbeat/${monitor.id}`);
                                        toast.success("Copied to clipboard");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                    GET
                                </Badge>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                    POST
                                </Badge>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                    HEAD
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                            <CardTitle className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Last check</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="text-xl font-bold text-text-primary">
                                {lastTick ? `${formatDuration(differenceInSeconds(now, new Date(lastTick.createdAt)))} ago` : "Never"}
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

                <Card className="bg-card-bg border-border-color overflow-hidden min-w-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border-color px-6 py-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {monitor.ticks && monitor.ticks.length > 0 ? (
                            <div className="flex flex-col">
                                {monitor.ticks.slice(0, 10).map((tick, i) => (
                                    <div
                                        key={tick.id}
                                        className="flex items-center justify-between px-6 py-3 border-b border-border last:border-0 hover:bg-hover-bg/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${i === 0 ? 'bg-green-500/10' : 'bg-transparent'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${tick.status === 'Up' ? 'bg-green-500' : 'bg-red-500'
                                                    } ${i === 0 ? 'animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-text-primary">
                                                    {tick.status === 'Up' ? 'Heartbeat Received' : 'Missed / Down'}
                                                </span>
                                                <span className="text-xs text-text-muted">
                                                    {format(new Date(tick.createdAt), "MMMM d, yyyy 'at' HH:mm:ss")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-text-muted opacity-50">
                                <Activity className="w-8 h-8 mb-2" />
                                <p>No activity recorded yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
            </div>
        </div>
    )
}
