"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { tokenManager } from "@/lib/auth/tokenManager"
import { getMonitors, Monitor } from "@/lib/api/monitors"
import { createStatusPage } from "@/lib/api/statusPages"

export default function CreateStatusPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [slug, setSlug] = React.useState("")
    const [monitors, setMonitors] = React.useState<Monitor[]>([])
    const [selectedMonitors, setSelectedMonitors] = React.useState<string[]>([])
    const [loadingMonitors, setLoadingMonitors] = React.useState(true)

    React.useEffect(() => {
        fetchMonitors()
    }, [])

    const fetchMonitors = async () => {
        try {
            const token = tokenManager.getToken()
            if (!token) return
            const data = await getMonitors(token)
            setMonitors(data)
        } catch (error) {
            toast.error("Failed to load monitors")
        } finally {
            setLoadingMonitors(false)
        }
    }

    const handleCreate = async () => {
        if (!name || !slug) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsLoading(true)
        try {
            const token = tokenManager.getToken()
            if (!token) throw new Error("No token")

            await createStatusPage({
                name,
                slug,
                monitorIds: selectedMonitors
            }, token)

            toast.success("Status page created successfully")
            router.push("/dashboard/status-pages")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to create status page")
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-generate slug
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setName(val)
        // Simple slugify
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    }

    const toggleMonitor = (id: string) => {
        setSelectedMonitors(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <div className="max-w-2xl mx-auto w-full pb-20">
            <div className="mb-6 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-text-primary">Create Status Page</h1>
            </div>

            <div className="space-y-6">
                <Card className="bg-card-bg border-border">
                    <CardHeader>
                        <CardTitle>Page Details</CardTitle>
                        <CardDescription>
                            Basic information about your public status page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Acme Inc. Status"
                                value={name}
                                onChange={handleNameChange}
                                className="bg-bg-primary border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug</Label>
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-text-muted bg-bg-primary px-3 py-2 rounded border border-border">
                                    betterstack.com/status/
                                </div>
                                <Input
                                    id="slug"
                                    placeholder="acme-inc"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="bg-bg-primary border-border flex-1"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card-bg border-border">
                    <CardHeader>
                        <CardTitle>Select Monitors</CardTitle>
                        <CardDescription>
                            Choose which monitors to display on this status page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingMonitors ? (
                            <div className="py-8 text-center text-text-muted">Loading monitors...</div>
                        ) : monitors.length === 0 ? (
                            <div className="py-8 text-center text-text-muted">No monitors found. Create one first!</div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {monitors.map(monitor => (
                                    <div
                                        key={monitor.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedMonitors.includes(monitor.id)
                                                ? 'bg-button-primary/10 border-button-primary'
                                                : 'bg-bg-primary border-border hover:border-text-muted'
                                            }`}
                                        onClick={() => toggleMonitor(monitor.id)}
                                    >
                                        <Checkbox
                                            id={monitor.id}
                                            checked={selectedMonitors.includes(monitor.id)}
                                            onCheckedChange={() => toggleMonitor(monitor.id)}
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor={monitor.id} className="cursor-pointer font-medium text-text-primary block">
                                                {monitor.url}
                                            </Label>
                                            <div className="text-xs text-text-muted mt-0.5">
                                                Status: {monitor.ticks?.[0]?.status || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 text-xs text-text-muted text-right">
                            {selectedMonitors.length} selected
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => router.back()} className="border-border">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isLoading || !name || !slug}
                        className="bg-button-primary hover:bg-button-primaryHover text-white"
                    >
                        {isLoading ? "Creating..." : "Create Status Page"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
