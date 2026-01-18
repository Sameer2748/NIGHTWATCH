import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

export interface Monitor {
    id: string;
    url: string;
    timeAdded: string;
    user_id: string;
    ticks?: WebsiteTick[];
}

export interface WebsiteTick {
    id: string;
    response_time_ms: number;
    dns_time_ms?: number | null;
    tcp_time_ms?: number | null;
    tls_time_ms?: number | null;
    ttfb_ms?: number | null;
    download_time_ms?: number | null;
    status: "Up" | "Down" | "Unknown";
    region_id: string;
    website_id: string;
    createdAt: string;
}

export interface Incident {
    id: string;
    website_id: string;
    region_id: string;
    startedAt: string;
    resolvedAt: string | null;
    duration: number | null;
    status: "ONGOING" | "RESOLVED";
    acknowledgedAt: string | null;
    acknowledgedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function acknowledgeIncident(incidentId: string, token: string): Promise<Incident> {
    const response = await axios.post(
        `${API_BASE_URL}/website/incident/${incidentId}/acknowledge`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
}

export interface EscalationStep {
    id: string;
    website_id: string;
    order: number;
    type: "CALL" | "SMS" | "EMAIL" | "PUSH";
    value: string;
}

export interface MonitorDetails extends Monitor {
    ticks: WebsiteTick[];
    incidents: Incident[];
    escalationSteps?: EscalationStep[];
}

export async function createMonitor(url: string, token: string, escalationSteps?: any[], keywordCheck?: string): Promise<Monitor> {
    const response = await axios.post(
        `${API_BASE_URL}/website`,
        { url, escalationSteps, keywordCheck },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
}

export async function getMonitors(token: string): Promise<Monitor[]> {
    const response = await axios.get(`${API_BASE_URL}/website`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}

export async function getMonitorDetails(id: string, token: string, regionId?: string): Promise<MonitorDetails> {
    const params = regionId ? { region_id: regionId } : {};
    const response = await axios.get(`${API_BASE_URL}/website/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params
    });
    return response.data;
}

export async function sendTestAlert(id: string, token: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/website/${id}/test-alert`, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export async function deleteMonitor(id: string, token: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/website/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
