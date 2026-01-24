"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, Search, Activity, Pause, Play, Trash2, HeartPulse } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { tokenManager } from "@/lib/auth/tokenManager"
import { getMonitors, Monitor, deleteMonitor, toggleMonitorPause } from "@/lib/api/monitors"

export default function HeartbeatsPage() {
    const router = useRouter()
    const [monitors, setMonitors] = React.useState<Monitor[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)
    const [isPausing, setIsPausing] = React.useState<string | null>(null)

    React.useEffect(() => {
        fetchMonitors()
    }, [])

    // Auto-refresh every 5 seconds for live status
    React.useEffect(() => {
        if (monitors.length === 0) return;

        const interval = setInterval(() => {
            fetchMonitors(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [monitors])


    const fetchMonitors = async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const token = tokenManager.getToken()
            if (!token) {
                router.push("/signin")
                return
            }
            const data = await getMonitors(token)
            // Filter only Heartbeats
            setMonitors(data.filter(m => m.type === 'HEARTBEAT'))
        } catch (error) {
            console.error("Error fetching heartbeats:", error)
            if (!silent) toast.error("Failed to load heartbeats")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click

        if (!confirm("Are you sure you want to delete this heartbeat monitor? This action cannot be undone.")) return;

        setIsDeleting(id);
        const token = tokenManager.getToken();
        if (!token) return;

        try {
            await deleteMonitor(id, token);
            toast.success("Heartbeat monitor deleted successfully");
            setMonitors(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error("Failed to delete monitor:", error);
            toast.error("Failed to delete monitor");
        } finally {
            setIsDeleting(null);
        }
    }

    const handlePause = async (e: React.MouseEvent, monitor: Monitor) => {
        e.stopPropagation();
        setIsPausing(monitor.id);
        const token = tokenManager.getToken();
        if (!token) return;

        try {
            const newStatus = !monitor.paused;
            await toggleMonitorPause(monitor.id, newStatus, token);
            toast.success(newStatus ? "Heartbeat paused" : "Heartbeat resumed");
            // Update local state
            setMonitors(prev => prev.map(m => m.id === monitor.id ? { ...m, paused: newStatus } : m));
        } catch (error) {
            console.error("Failed to toggle pause:", error);
            toast.error("Failed to update status");
        } finally {
            setIsPausing(null);
        }
    }

    const filteredMonitors = monitors.filter(m =>
        m.url.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">

                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Heartbeats</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-button-primary transition-colors" />
                        <Input
                            placeholder="Search cron jobs..."
                            className="pl-10 pr-10 bg-bg-primary border-border focus:ring-1 focus:ring-button-primary h-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        className="bg-button-primary hover:bg-button-primaryHover text-button-text font-semibold flex items-center gap-2 h-10 px-4"
                        onClick={() => router.push("/dashboard/heartbeats/create")}
                    >
                        Create heartbeat
                        <Plus className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div >

            <div className="flex flex-col gap-1 mt-4">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-text-muted gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-button-primary border-t-transparent animate-spin"></div>
                        <p>Loading heartbeats...</p>
                    </div>
                ) : filteredMonitors.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 text-pink-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">No heartbeats found</h3>
                        <p className="text-text-muted max-w-sm mb-6">
                            {searchQuery ? `No heartbeats matching "${searchQuery}"` : "Monitor your cron jobs and background workers with Heartbeats."}
                        </p>
                        {!searchQuery && (
                            <Button
                                variant="outline"
                                className="border-border hover:bg-hover-bg text-text-primary"
                                onClick={() => router.push("/dashboard/heartbeats/create")}
                            >
                                Create your first heartbeat
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-card-bg border-b border-border flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <Activity className="w-3 h-3" />
                            Heartbeats
                        </div>

                        {filteredMonitors.map((monitor) => {
                            const lastTick = monitor.ticks?.[0];
                            const status = lastTick?.status || "Unknown";
                            const statusColor = status === "Up" ? "green" : status === "Down" ? "red" : "gray";

                            return (
                                <div
                                    key={monitor.id}
                                    className="group flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-hover-bg/30 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/heartbeats/${monitor.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full bg-${statusColor}-500 shadow-[0_0_8px_rgba(${statusColor === 'green' ? '34,197,94' : statusColor === 'red' ? '239,68,68' : '107,114,128'},0.4)]`}></div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-text-primary group-hover:text-button-primary transition-colors">{monitor.url}</span>
                                            <span className="text-xs text-text-muted">
                                                <span className={`text-${statusColor}-500 font-medium`}>{status}</span> · Expected every {monitor.period}s
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex items-center gap-1.5 text-text-muted">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs font-medium">1m</span>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card-bg border-border w-48">
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2 cursor-pointer"
                                                    onClick={(e) => handlePause(e, monitor)}
                                                    disabled={isPausing === monitor.id}
                                                >
                                                    {monitor.paused ? <Play className="w-4 h-4 text-green-500" /> : <Pause className="w-4 h-4 text-orange-500" />}
                                                    {isPausing === monitor.id ? "Updating..." : (monitor.paused ? "Resume" : "Pause")}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 focus:text-red-600 focus:bg-red-500/10"
                                                    onClick={(e) => handleDelete(e, monitor.id)}
                                                    disabled={isDeleting === monitor.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {isDeleting === monitor.id ? "Deleting..." : "Delete"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    )
}
