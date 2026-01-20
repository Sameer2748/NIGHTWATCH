"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Activity, Trash2, Globe, ExternalLink, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { tokenManager } from "@/lib/auth/tokenManager"
import { getStatusPages, deleteStatusPage, StatusPage } from "@/lib/api/statusPages"
import { Badge } from "@/components/ui/badge"

export default function StatusPagesList() {
    const router = useRouter()
    const [pages, setPages] = React.useState<StatusPage[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

    React.useEffect(() => {
        fetchPages()
    }, [])

    const fetchPages = async () => {
        setIsLoading(true)
        try {
            const token = tokenManager.getToken()
            if (!token) {
                router.push("/signin")
                return
            }
            const data = await getStatusPages(token)
            setPages(data)
        } catch (error) {
            console.error("Error fetching status pages:", error)
            toast.error("Failed to load status pages")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure? This will make the public page inaccessible.")) return;

        setIsDeleting(id);
        const token = tokenManager.getToken();
        if (!token) return;

        try {
            await deleteStatusPage(id, token);
            toast.success("Status page deleted");
            setPages(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            toast.error("Failed to delete status page");
        } finally {
            setIsDeleting(null);
        }
    }

    const filteredPages = pages.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Status Pages</h1>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-button-primary hover:bg-button-primaryHover text-button-text font-semibold flex items-center gap-2 h-10 px-4"
                        onClick={() => router.push("/dashboard/status-pages/create")}
                    >
                        <Plus className="w-4 h-4" />
                        New Status Page
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-1 mt-4">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-text-muted gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-button-primary border-t-transparent animate-spin"></div>
                        <p>Loading status pages...</p>
                    </div>
                ) : filteredPages.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                        <Globe className="w-16 h-16 text-text-muted mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-text-primary mb-2">No status pages yet</h3>
                        <p className="text-text-muted max-w-sm mb-6">Create a public status page to communicate your system's health to users.</p>
                        <Button
                            onClick={() => router.push("/dashboard/status-pages/create")}
                            className="bg-button-primary hover:bg-button-primaryHover"
                        >
                            Create Status Page
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPages.map((page) => (
                            <div
                                key={page.id}
                                className="bg-card-bg border border-border rounded-xl p-5 hover:border-button-primary/50 transition-colors group relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card-bg border-border">
                                            <DropdownMenuItem className="text-red-500 hover:text-red-600 cursor-pointer" onClick={(e) => handleDelete(e, page.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <h3 className="text-lg font-semibold text-text-primary mb-1">{page.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                                    <span className="bg-bg-primary px-2 py-0.5 rounded border border-border">/{page.slug}</span>
                                    <span>•</span>
                                    <span>{page._count?.monitors || 0} monitors</span>
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border">
                                    <a
                                        href={`/status/${page.slug}`}
                                        target="_blank"
                                        className="text-xs font-medium text-button-primary hover:underline flex items-center gap-1"
                                    >
                                        View Public Page <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
