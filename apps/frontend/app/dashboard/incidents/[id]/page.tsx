'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Mail, MessageSquare, Phone, ChevronDown, ChevronUp, UserCheck, Globe } from 'lucide-react';
import { getIncidentDetails, IncidentWithDetails } from '@/lib/api/incidents';
import { tokenManager } from '@/lib/auth/tokenManager';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IncidentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [incident, setIncident] = useState<IncidentWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openTimelineId, setOpenTimelineId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchDetails = async () => {
            const token = tokenManager.getToken();
            if (!token) {
                router.push('/signin');
                return;
            }

            try {
                const data = await getIncidentDetails(id, token);
                setIncident(data);
            } catch (error) {
                console.error("Failed to fetch incident details", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id, router]);

    if (isLoading) return <div className="p-8 text-center text-text-muted">Loading details...</div>;
    if (!incident) return <div className="p-8 text-center text-text-muted">Incident not found</div>;

    return (
        <div className="w-full max-w-full pb-20 fade-in px-4 md:px-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/incidents')}
                        className="pl-0 -ml-2 hover:pl-2 transition-all text-text-muted hover:text-text-primary group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Incidents
                    </Button>

                    <div>
                        <div className="flex items-center gap-3 text-text-primary mt-2">
                            <Globe className="w-7 h-7 text-text-secondary" />
                            <h1 className="text-3xl font-bold tracking-tight">{incident.website.url}</h1>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Card */}
                {incident.duration && (
                    <Card className="border-border bg-card-bg/50 backdrop-blur-sm min-w-[200px]">
                        <CardContent className="p-4">
                            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Total Downtime</div>
                            <div className="text-2xl font-mono font-bold text-text-primary flex items-baseline gap-1">
                                {Math.floor(incident.duration / 60)}<span className="text-lg text-text-muted">m</span>
                                {incident.duration % 60}<span className="text-lg text-text-muted">s</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Timeline Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border bg-card-bg/40 backdrop-blur-md shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-card-bg/50">
                            <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <Clock className="w-5 h-5 text-button-primary" />
                                Escalation Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative space-y-0">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-border" />

                                {/* Incident Started Node */}
                                <TimelineItem
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                    iconBg="bg-neutral-900 text-white"
                                    title="Incident Started"
                                    timestamp={format(new Date(incident.startedAt), 'MMM dd, yyyy • HH:mm:ss')}
                                    isOpen={openTimelineId === 'started'}
                                    onToggle={() => setOpenTimelineId(prev => prev === 'started' ? null : 'started')}
                                >
                                    <p className="text-sm text-text-muted">
                                        Usage Monitors detected a failure responding from {incident.website.type} check.
                                    </p>
                                </TimelineItem>

                                {/* Events Stream */}
                                {incident.events.map((event, index) => (
                                    <TimelineItem
                                        key={event.id}
                                        icon={
                                            event.type === 'EMAIL' ? <Mail className="w-4 h-4" /> :
                                                event.type === 'SMS' ? <MessageSquare className="w-4 h-4" /> :
                                                    <Phone className="w-4 h-4" />
                                        }
                                        iconBg={
                                            'bg-white border border-gray-200 text-gray-700'
                                        }
                                        title={
                                            event.type === 'EMAIL' ? 'Email Notification' :
                                                event.type === 'SMS' ? 'SMS Alert' :
                                                    'Escalated Call'
                                        }
                                        badge={
                                            <Badge
                                                variant={event.status === 'SENT' ? 'default' : event.status === 'FAILED' ? 'destructive' : 'secondary'}
                                                className="text-[10px] h-5 px-2"
                                            >
                                                {event.status}
                                            </Badge>
                                        }
                                        timestamp={format(new Date(event.createdAt), 'HH:mm:ss')}
                                        isOpen={openTimelineId === event.id}
                                        onToggle={() => setOpenTimelineId(prev => prev === event.id ? null : event.id)}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-text-muted">To:</span>
                                                <span className="text-sm font-medium text-text-primary">{event.value}</span>
                                            </div>
                                            {event.message && (
                                                <p className="text-xs text-text-muted italic border-t border-border/50 pt-2 mt-2">
                                                    "{event.message}"
                                                </p>
                                            )}
                                        </div>
                                    </TimelineItem>
                                ))}

                                {/* Acknowledgement Event (if acknowledged) */}
                                {incident.acknowledgedAt && (
                                    <TimelineItem
                                        icon={<CheckCircle className="w-4 h-4" />}
                                        iconBg="bg-neutral-900 text-white"
                                        title="Incident Resolved"
                                        timestamp={format(new Date(incident.acknowledgedAt), 'MMM dd, yyyy • HH:mm:ss')}
                                        isOpen={openTimelineId === 'ack'}
                                        onToggle={() => setOpenTimelineId(prev => prev === 'ack' ? null : 'ack')}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-text-muted">Resolved by:</span>
                                                <span className="text-sm font-medium text-text-primary">{incident.acknowledgedBy || 'User'}</span>
                                            </div>
                                            <p className="text-xs text-text-muted italic border-t border-border/50 pt-2 mt-2">
                                                "User manually acknowledged and resolved this incident."
                                            </p>
                                        </div>
                                    </TimelineItem>
                                )}

                                {/* Resolved Event (if resolved) */}
                                {/* Resolved Event (System Auto-Resolve only) */}
                                {incident.resolvedAt && !incident.acknowledgedAt && (
                                    <TimelineItem
                                        icon={<CheckCircle className="w-4 h-4" />}
                                        iconBg="bg-neutral-900 text-white"
                                        title="Incident Resolved"
                                        timestamp={format(new Date(incident.resolvedAt), 'MMM dd, yyyy • HH:mm:ss')}
                                        isOpen={openTimelineId === 'resolved'}
                                        onToggle={() => setOpenTimelineId(prev => prev === 'resolved' ? null : 'resolved')}
                                    >
                                        <p className="text-sm text-text-muted">
                                            System recovered, checks passed efficiently.
                                        </p>
                                    </TimelineItem>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-6 sticky top-6">
                    <Card className="border-border bg-card-bg/30">
                        <CardHeader>
                            <CardTitle className="text-base text-text-primary">Incident Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Region</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🇮🇳</span>
                                    <span className="text-text-primary font-medium">{incident.region_id?.includes('india') ? 'India (Mumbai)' : 'USA (N. Virginia)'}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Alert Policy</div>
                                <div className="space-y-2">
                                    {incident.website.escalationSteps && incident.website.escalationSteps.length > 0 ? (
                                        incident.website.escalationSteps.map((step, index) => (
                                            <div key={step.id} className="flex items-start gap-2 text-sm">
                                                <span className="text-text-muted font-mono">{index + 1}.</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {step.type === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                                                        {step.type === 'SMS' && <MessageSquare className="w-3.5 h-3.5 text-green-500" />}
                                                        {step.type === 'CALL' && <Phone className="w-3.5 h-3.5 text-orange-500" />}
                                                        <span className="font-medium text-text-primary">{step.type}</span>
                                                    </div>
                                                    <div className="text-xs text-text-muted mt-0.5 truncate">{step.value}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-text-muted text-sm">No escalation policy configured</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Acknowledged By</div>
                                {incident.acknowledgedBy ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                                        {incident.acknowledgedBy}
                                    </Badge>
                                ) : (
                                    <div className="text-text-muted">—</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Timeline Item Component with Accordion
interface TimelineItemProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    badge?: React.ReactNode;
    timestamp: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

function TimelineItem({ icon, iconBg, title, badge, timestamp, children, isOpen, onToggle }: TimelineItemProps) {
    return (
        <div className="relative group">
            {/* Timeline Icon - Properly aligned with vertical line */}
            <div className={`absolute left-0 top-3 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110`}>
                {icon}
            </div>

            {/* Content */}
            <div className="ml-14 mb-6">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggle();
                    }}
                    className="w-full text-left group/button"
                >
                    <div className="flex items-start justify-between gap-4 hover:opacity-80 transition-opacity">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-text-primary text-base">{title}</h3>
                                {badge}
                            </div>
                            <p className="text-xs font-mono text-text-muted">{timestamp}</p>
                        </div>

                        {/* Toggle Icon - Swaps between Up/Down */}
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-text-primary">
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </div>
                    </div>

                    {/* Expanded Content - No border, no background */}
                    {isOpen && (
                        <div className="mt-4 pl-0 animate-in slide-in-from-top-2 duration-200">
                            {children}
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
