"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Info, Plus, Trash2, Phone, Mail, MessageSquare } from "lucide-react"
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
import { createMonitor } from "@/lib/api/monitors"
import { tokenManager } from "@/lib/auth/tokenManager"

interface EscalationContact {
    id: string;
    type: 'CALL' | 'SMS' | 'EMAIL';
    value: string;
}

const unitMultipliers: Record<string, number> = {
    'seconds': 1,
    'minutes': 60,
    'hours': 3600,
    'days': 86400
}

export default function CreateHeartbeatPage() {
    const router = useRouter()
    const [name, setName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [emailEnabled, setEmailEnabled] = React.useState(true)
    const [contacts, setContacts] = React.useState<EscalationContact[]>([])

    const [periodValue, setPeriodValue] = React.useState("1")
    const [periodUnit, setPeriodUnit] = React.useState("days")

    const [graceValue, setGraceValue] = React.useState("5")
    const [graceUnit, setGraceUnit] = React.useState("minutes")

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
        if (!name) {
            toast.error("Please enter a monitor name")
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

            const totalPeriod = parseInt(periodValue) * (unitMultipliers[periodUnit] || 1);
            const totalGrace = parseInt(graceValue) * (unitMultipliers[graceUnit] || 1);

            await createMonitor(
                name,
                token!,
                escalationSteps,
                undefined, // keywordCheck
                "HEARTBEAT",
                totalPeriod,
                totalGrace
            )

            toast.success("Heartbeat monitor created")
            router.push("/dashboard/heartbeats")
        } catch (error) {
            console.error("Error creating heartbeat:", error)
            toast.error("Failed to create heartbeat")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl pb-20">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="flex items-center gap-1 hover:text-text-primary cursor-pointer" onClick={() => router.push("/dashboard/heartbeats")}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    Heartbeats
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-text-primary font-medium">Create heartbeat</span>
            </div>

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Create Heartbeat</h1>
                    <p className="text-text-muted mt-2">Monitor your cron jobs and background workers.</p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-button-primary/10 text-button-primary text-xs">1</span>
                        Configuration
                    </h2>

                    <Card className="border-border bg-card-bg/30 backdrop-blur-md shadow-sm">
                        <CardContent className="pt-6 space-y-6">

                            <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                <p className="text-sm text-pink-400 flex items-start gap-2">
                                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                    Active monitoring (Heartbeat) works by sending a request to a unique URL we provide. Useful for cron jobs and background workers.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-sm font-medium text-text-muted">What service will this heartbeat track?</Label>
                                <Input
                                    id="name"
                                    placeholder="Example: Daily database backup"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-transparent border-border h-11 focus:ring-button-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                <div className="space-y-3">
                                    <Label htmlFor="period" className="text-sm font-medium text-text-muted">Expect a heartbeat every</Label>
                                    <div className="flex relative items-center">
                                        <Input
                                            id="period"
                                            type="number"
                                            value={periodValue}
                                            onChange={(e) => setPeriodValue(e.target.value)}
                                            className="bg-transparent border-border h-11 focus:ring-button-primary focus:z-10 w-24 rounded-r-none border-r-0"
                                        />
                                        <Select
                                            value={periodUnit}
                                            onValueChange={setPeriodUnit}
                                        >
                                            <SelectTrigger className="bg-transparent border-border h-11 focus:ring-button-primary focus:z-10 w-32 rounded-l-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card-bg border-border">
                                                <SelectItem value="seconds">seconds</SelectItem>
                                                <SelectItem value="minutes">minutes</SelectItem>
                                                <SelectItem value="hours">hours</SelectItem>
                                                <SelectItem value="days">days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="grace" className="text-sm font-medium text-text-muted flex items-center gap-1">
                                        with a grace period <Info className="w-3 h-3" /> of
                                    </Label>
                                    <div className="flex relative items-center">
                                        <Input
                                            id="grace"
                                            type="number"
                                            value={graceValue}
                                            onChange={(e) => setGraceValue(e.target.value)}
                                            className="bg-transparent border-border h-11 focus:ring-button-primary focus:z-10 w-24 rounded-r-none border-r-0"
                                        />
                                        <Select
                                            value={graceUnit}
                                            onValueChange={setGraceUnit}
                                        >
                                            <SelectTrigger className="bg-transparent border-border h-11 focus:ring-button-primary focus:z-10 w-32 rounded-l-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card-bg border-border">
                                                <SelectItem value="seconds">seconds</SelectItem>
                                                <SelectItem value="minutes">minutes</SelectItem>
                                                <SelectItem value="hours">hours</SelectItem>
                                                <SelectItem value="days">days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
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

                    <Card className="border-border bg-card-bg/30 backdrop-blur-md shadow-sm">
                        <CardContent className="pt-6 space-y-6">
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

                            <div className="space-y-3">
                                {contacts.length > 0 && (
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Escalation Sequence</p>
                                )}
                                {contacts.map((contact, index) => (
                                    <div key={contact.id} className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary text-[10px] font-bold text-text-muted border border-border">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 p-1.5 bg-bg-primary/40 rounded-xl border border-border transition-colors">
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
                            </div>
                        </CardContent>
                    </Card>
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
                                Creating Heartbeat...
                            </div>
                        ) : "Create Heartbeat"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
