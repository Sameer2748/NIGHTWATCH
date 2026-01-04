"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Info } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { createMonitor } from "@/lib/api/monitors"
import { tokenManager } from "@/lib/auth/tokenManager"

export default function CreateMonitorPage() {
    const router = useRouter()
    const [url, setUrl] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

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

            await createMonitor(url, token)
            toast.success("Monitor created successfully")
            router.push("/dashboard/monitors")
        } catch (error) {
            console.error("Error creating monitor:", error)
            toast.error("Failed to create monitor")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl pb-10">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="flex items-center gap-1 hover:text-text-primary cursor-pointer" onClick={() => router.push("/dashboard/monitors")}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    Monitors
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-text-primary font-medium">Create monitor</span>
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Create monitor</h1>

                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-text-primary mt-8">What to monitor</h2>
                    <p className="text-sm text-text-muted">
                        Configure the target website you want to monitor. You'll find the advanced configuration below, in the advanced settings section.
                    </p>
                </div>

                <Card className="border-border bg-card-bg/50 backdrop-blur-sm shadow-sm">
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-1.5 text-sm font-medium">
                                    Alert us when <Info className="w-4 h-4 text-text-muted" />
                                </Label>
                                <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-button-primary/10 text-button-primary uppercase tracking-wider">
                                    Billable
                                </div>
                            </div>
                            <Select defaultValue="unavailable">
                                <SelectTrigger className="bg-bg-primary border-border h-10 w-full">
                                    <SelectValue placeholder="Select alert condition" />
                                </SelectTrigger>
                                <SelectContent className="bg-card-bg border-border">
                                    <SelectItem value="unavailable">URL becomes unavailable</SelectItem>
                                    <SelectItem value="keyword">Keyword is missing</SelectItem>
                                    <SelectItem value="content">Content changes</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-text-muted italic">
                                We recommend the keyword matching method. <span className="text-button-primary cursor-pointer hover:underline">Upgrade your account</span> to enable more options.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="url" className="flex items-center gap-1.5 text-sm font-medium">
                                URL to monitor <Info className="w-4 h-4 text-text-muted" />
                            </Label>
                            <Input
                                id="url"
                                placeholder="https://"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="bg-bg-primary border-border h-10"
                            />
                            <p className="text-xs text-text-muted italic">
                                You can import multiple monitors <span className="text-button-primary cursor-pointer hover:underline">here</span>.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-2 mt-8">
                    <h2 className="text-lg font-semibold text-text-primary mt-8">On-call escalation</h2>
                    <p className="text-sm text-text-muted">
                        Set up rules for who's going to be notified and how when an incident occurs.
                    </p>
                </div>

                <Card className="border-border bg-card-bg/50 backdrop-blur-sm shadow-sm">
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">When there's a new incident</Label>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="call" disabled />
                                    <label htmlFor="call" className="text-sm text-text-muted cursor-not-allowed">Call</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sms" disabled />
                                    <label htmlFor="sms" className="text-sm text-text-muted cursor-not-allowed">SMS</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="email" checked />
                                    <label htmlFor="email" className="text-sm text-text-primary font-medium">E-mail</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="push" disabled />
                                    <label htmlFor="push" className="text-sm text-text-muted cursor-not-allowed">Push notification</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="critical" disabled />
                                    <label htmlFor="critical" className="text-sm text-text-muted cursor-not-allowed flex items-center gap-1">
                                        Critical alert <Info className="w-3 h-3" />
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-text-muted">
                                the <span className="text-button-primary cursor-pointer hover:underline">current on-call person</span>
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border space-y-4">
                            <Label className="text-sm font-medium">If the on-call person doesn't acknowledge the incident</Label>
                            <Select defaultValue="nothing">
                                <SelectTrigger className="bg-bg-primary border-border h-10 w-full">
                                    <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent className="bg-card-bg border-border">
                                    <SelectItem value="nothing">Do nothing</SelectItem>
                                    <SelectItem value="escalate">Escalate to next person</SelectItem>
                                    <SelectItem value="notify-team">Notify entire team</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-text-muted">
                                Set up an <span className="text-button-primary cursor-pointer hover:underline">advanced escalation policy</span> and <span className="text-button-primary cursor-pointer hover:underline">let responders choose</span> how they want to be notified.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="advanced" className="border-border">
                            <AccordionTrigger className="text-text-primary hover:text-button-primary text-sm font-medium">
                                Advanced settings
                            </AccordionTrigger>
                            <AccordionContent className="text-text-muted text-sm px-1 py-4">
                                Advanced monitoring options like custom headers, cookies, and SSL verification will be available here.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="metadata" className="border-border">
                            <AccordionTrigger className="text-text-primary hover:text-button-primary text-sm font-medium">
                                Metadata
                            </AccordionTrigger>
                            <AccordionContent className="text-text-muted text-sm px-1 py-4">
                                Add tags and extra metadata to your monitor for better organization.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div className="pt-10">
                    <Button
                        className="bg-button-primary hover:bg-button-primaryHover text-button-text font-semibold px-8 h-11"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating..." : "Create monitor"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
