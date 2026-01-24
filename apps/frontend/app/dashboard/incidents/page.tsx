'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle, CheckCircle2, Clock, Monitor, Search,
    ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, Calendar,
    Filter
} from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getIncidents, IncidentWithDetails } from '@/lib/api/incidents';
import { tokenManager } from '@/lib/auth/tokenManager';
import { format, subDays, subHours, isAfter } from 'date-fns';

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<IncidentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState('all'); // 24h, 7d, 30d, all

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchIncidents = async () => {
            const token = tokenManager.getToken();
            if (!token) {
                router.push('/signin');
                return;
            }

            try {
                const data = await getIncidents(token);
                setIncidents(data);
            } catch (error) {
                console.error("Failed to fetch incidents", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIncidents();
    }, [router]);

    // Filtering Logic
    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = (incident.website?.url || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesTime = true;
        const startedAt = new Date(incident.startedAt);
        const now = new Date();

        if (timeFilter === '24h') {
            matchesTime = isAfter(startedAt, subHours(now, 24));
        } else if (timeFilter === '7d') {
            matchesTime = isAfter(startedAt, subDays(now, 7));
        } else if (timeFilter === '30d') {
            matchesTime = isAfter(startedAt, subDays(now, 30));
        }

        return matchesSearch && matchesTime;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
    const paginatedIncidents = filteredIncidents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading) {
        return <div className="p-8 text-center text-text-muted">Loading incidents...</div>;
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Incidents</h1>
                    <p className="text-text-muted mt-1">Manage and track your monitor downtime history.</p>
                </div>
                {/* Add Manually Button (Mock) */}
                {/* <Button className="bg-button-primary hover:opacity-90">
                    + Add Incident
                </Button> */}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg/30 p-1 rounded-lg">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                    <Input
                        placeholder="Search by URL..."
                        className="pl-9 bg-card-bg border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[180px] bg-card-bg border-border">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-text-muted" />
                                <SelectValue placeholder="Time Range" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border border-border bg-card-bg/30 backdrop-blur-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-card-bg/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-[400px]">Monitor URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started At</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedIncidents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-text-muted">
                                    No incidents found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedIncidents.map((incident) => {
                                // Logic: Treat acknowledged as Resolved
                                const isResolved = incident.status === 'RESOLVED' || !!incident.acknowledgedAt;

                                return (
                                    <TableRow
                                        key={incident.id}
                                        className="hover:bg-card-bg/40 transition-colors border-border/50 group"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg border ${isResolved
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-600'
                                                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                                                    }`}>
                                                    {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                </div>
                                                <span className="text-text-primary text-base font-semibold tracking-tight">
                                                    {incident.website?.url || 'Unknown Monitor'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`
                                                    font-semibold capitalize border
                                                    ${isResolved
                                                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-pulse'}
                                                `}
                                            >
                                                {isResolved ? 'Resolved' : 'Ongoing'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {format(new Date(incident.startedAt), 'MMM dd, yyyy • HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-text-secondary font-mono text-xs">
                                            {incident.duration ? (
                                                `${Math.floor(incident.duration / 60)}m ${incident.duration % 60}s`
                                            ) : (
                                                <span className="text-text-muted">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/incidents/${incident.id}`)}
                                                className="text-text-muted hover:text-text-primary hover:bg-card-bg"
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-text-muted">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
