"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Info, Plus, Trash2, Phone, Mail, MessageSquare, GripVertical } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { createMonitor } from "@/lib/api/monitors"
import { tokenManager } from "@/lib/auth/tokenManager"
import { Badge } from "@/components/ui/badge"

interface EscalationContact {
    id: string;
    type: 'CALL' | 'SMS' | 'EMAIL';
    value: string;
}

export default function CreateMonitorPage() {
    const router = useRouter()
    const [url, setUrl] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [emailEnabled, setEmailEnabled] = React.useState(true)
    const [contacts, setContacts] = React.useState<EscalationContact[]>([])

    const addContact = () => {
        const newContact: EscalationContact = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'SMS',
            value: ''
        }
        setContacts([...contacts, newContact])
    }

    const removeContact = (id: string) => {
        setContacts(contacts.filter(c => c.id !== id))
    }

    const updateContact = (id: string, field: keyof EscalationContact, value: string) => {
        setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) {
            toast.error("Please enter a website URL")
            return
        }

        setIsLoading(true)
        try {
            const token = tokenManager.getToken()
            if (!token) {
                toast.error("You must be logged in")
                router.push("/signin")
                return
            }

            // Construct escalation steps
            const escalationSteps = []
            if (emailEnabled) {
                escalationSteps.push({ type: 'EMAIL', value: 'OWNER', order: 0 })
            }

            contacts.forEach((contact, index) => {
                if (contact.value) {
                    escalationSteps.push({
                        type: contact.type,
                        value: contact.value,
                        order: escalationSteps.length
                    })
                }
            })

            await createMonitor(url, token, escalationSteps)
            toast.success("Monitor and Escalation Policy created")
            router.push("/dashboard/monitors")
        } catch (error) {
            console.error("Error creating monitor:", error)
            toast.error("Failed to create monitor")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl pb-20">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="flex items-center gap-1 hover:text-text-primary cursor-pointer" onClick={() => router.push("/dashboard/monitors")}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    Monitors
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-text-primary font-medium">Create monitor</span>
            </div>

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Create monitor</h1>
                    <p className="text-text-muted mt-2">Start monitoring your services in seconds.</p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-button-primary/10 text-button-primary text-xs">1</span>
                        What to monitor
                    </h2>
                    <Card className="border-border bg-card-bg/30 backdrop-blur-md shadow-sm border-white/5">
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="url" className="text-sm font-medium flex items-center gap-2">
                                    URL to monitor <Info className="w-3.5 h-3.5 text-text-muted" />
                                </Label>
                                <Input
                                    id="url"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="bg-bg-primary/50 border-border h-11 focus:ring-button-primary"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-button-primary/10 text-button-primary text-xs">2</span>
                            On-call escalation
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addContact}
                            className="bg-button-primary/5 border-button-primary/20 text-button-primary hover:bg-button-primary/10"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Alert
                        </Button>
                    </div>

                    <Card className="border-border bg-card-bg/30 backdrop-blur-md shadow-sm border-white/5">
                        <CardContent className="pt-6 space-y-6">
                            {/* Default Email Notification */}
                            <div className={`p-4 rounded-xl border transition-all ${emailEnabled ? 'bg-button-primary/5 border-button-primary/30' : 'bg-transparent border-border'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${emailEnabled ? 'bg-button-primary/20 text-button-primary' : 'bg-bg-secondary text-text-muted'}`}>
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">Send email alert</p>
                                            <p className="text-xs text-text-muted">Will notify your account email when down</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={emailEnabled}
                                        onChange={(e) => setEmailEnabled(e.target.checked)}
                                        className="w-5 h-5 rounded border-border text-button-primary focus:ring-button-primary"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Escalation Steps */}
                            <div className="space-y-3">
                                {contacts.length > 0 && (
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Escalation Sequence</p>
                                )}
                                {contacts.map((contact, index) => (
                                    <div key={contact.id} className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary text-[10px] font-bold text-text-muted border border-border">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 p-1.5 bg-bg-primary/40 rounded-xl border border-border group-hover:border-white/10 transition-colors">
                                            <Select
                                                value={contact.type}
                                                onValueChange={(val: any) => updateContact(contact.id, 'type', val)}
                                            >
                                                <SelectTrigger className="w-[110px] bg-transparent border-none h-8 text-xs focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card-bg border-border">
                                                    <SelectItem value="SMS">
                                                        <div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> SMS</div>
                                                    </SelectItem>
                                                    <SelectItem value="CALL">
                                                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Call</div>
                                                    </SelectItem>
                                                    <SelectItem value="EMAIL">
                                                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="h-4 w-px bg-border mx-1" />
                                            <Input
                                                placeholder={contact.type === 'EMAIL' ? "Enter email address" : "Enter phone with country code (+91...)"}
                                                value={contact.value}
                                                onChange={(e) => updateContact(contact.id, 'value', e.target.value)}
                                                className="flex-1 bg-transparent border-none h-8 text-xs focus-visible:ring-0 px-1"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeContact(contact.id)}
                                                className="h-8 w-8 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {contacts.length === 0 && !emailEnabled && (
                                    <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                                        <p className="text-xs text-text-muted">No alerts configured. You won't be notified of downtime.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <p className="text-xs text-text-muted italic px-2">
                        Steps will be executed in order. Calls will auto-escalate if not answered within 60 seconds.
                    </p>
                </div>

                <div className="pt-6">
                    <Button
                        className="w-full md:w-auto bg-button-primary hover:bg-button-primaryHover text-button-text font-bold px-12 h-12 rounded-xl shadow-lg shadow-button-primary/20 transition-all hover:scale-[1.02]"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Monitor...
                            </div>
                        ) : "Deploy Monitor"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
