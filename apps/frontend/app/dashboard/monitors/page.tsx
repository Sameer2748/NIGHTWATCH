"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, Search, Activity, Pause, Play, Trash2 } from "lucide-react"
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
import { getMonitors, Monitor } from "@/lib/api/monitors"

export default function MonitorsPage() {
    const router = useRouter()
    const [monitors, setMonitors] = React.useState<Monitor[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")


    React.useEffect(() => {
        fetchMonitors()
    }, [])

    // Auto-refresh every 30 seconds for live status
    React.useEffect(() => {
        if (monitors.length === 0) return;

        const thirtySeconds = 30 * 1000;

        const interval = setInterval(() => {
            fetchMonitors(true);
        }, thirtySeconds);

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
            setMonitors(data)
        } catch (error) {
            console.error("Error fetching monitors:", error)
            if (!silent) toast.error("Failed to load monitors")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    const filteredMonitors = monitors.filter(m =>
        m.url.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Monitors</h1>

                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-button-primary transition-colors" />
                        <Input
                            placeholder="Search"
                            className="pl-10 pr-10 bg-bg-primary border-border focus:ring-1 focus:ring-button-primary h-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-border bg-card-bg text-[10px] text-text-muted hidden sm:block">
                            /
                        </div>
                    </div>

                    <Button
                        className="bg-button-primary hover:bg-button-primaryHover text-button-text font-semibold flex items-center gap-2 h-10 px-4"
                        onClick={() => router.push("/dashboard/monitors/create")}
                    >
                        Create monitor
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="border-l border-button-text/20 pl-2 ml-1 cursor-pointer">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card-bg border-border">
                                <DropdownMenuItem onClick={() => { }}>New group</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { }}>Import monitors</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-1 mt-4">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-text-muted gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-button-primary border-t-transparent animate-spin"></div>
                        <p>Loading monitors...</p>
                    </div>
                ) : filteredMonitors.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">No monitors found</h3>
                        <p className="text-text-muted max-w-sm mb-6">
                            {searchQuery ? `No monitors matching "${searchQuery}"` : "You haven't created any monitors yet. Start tracking your websites today."}
                        </p>
                        {!searchQuery && (
                            <Button
                                variant="outline"
                                className="border-border hover:bg-hover-bg text-text-primary"
                                onClick={() => router.push("/dashboard/monitors/create")}
                            >
                                Create your first monitor
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-card-bg border-b border-border flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <svg className="w-3 h-3 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
                            Monitors
                        </div>

                        {filteredMonitors.map((monitor) => {
                            const lastTick = monitor.ticks?.[0];
                            const status = lastTick?.status || "Unknown";
                            const statusColor = status === "Up" ? "green" : status === "Down" ? "red" : "gray";

                            return (
                                <div
                                    key={monitor.id}
                                    className="group flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-hover-bg/30 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/monitors/${monitor.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full bg-${statusColor}-500 shadow-[0_0_8px_rgba(${statusColor === 'green' ? '34,197,94' : statusColor === 'red' ? '239,68,68' : '107,114,128'},0.4)]`}></div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-text-primary group-hover:text-button-primary transition-colors">{monitor.url}</span>
                                            <span className="text-xs text-text-muted">
                                                <span className={`text-${statusColor}-500 font-medium`}>{status}</span> · {new Date(monitor.timeAdded).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex items-center gap-1.5 text-text-muted">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs font-medium">3m</span>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card-bg border-border w-48">
                                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                                    <Pause className="w-4 h-4 text-orange-500" />
                                                    Pause
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                                    <Activity className="w-4 h-4" />
                                                    Acknowledge
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
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

            {!isLoading && monitors.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">Get the most out of Better Stack</h2>
                    <div className="bg-card-bg/50 border border-border rounded-xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full border-2 border-button-primary flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-button-primary"></div>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-text-primary">Connect Slack or Microsoft Teams</h3>
                                <span className="text-xs text-text-muted font-medium">5 out of 6 steps left</span>
                            </div>
                            <p className="text-sm text-text-muted max-w-xl">
                                Get alerted about new incidents, and acknowledge and resolve incidents directly from Slack.
                            </p>
                            <Button variant="outline" className="border-border hover:bg-hover-bg h-9 text-sm">
                                Integrations
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
