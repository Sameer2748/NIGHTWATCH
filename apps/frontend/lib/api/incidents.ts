import axios from "axios";
import { API_BASE_URL } from "./monitors";

export interface IncidentEvent {
    id: string;
    incident_id: string;
    type: "EMAIL" | "SMS" | "CALL" | "PUSH";
    status: "PENDING" | "SENT" | "FAILED";
    message?: string;
    createdAt: string;
    value: string;
}

export interface IncidentWithDetails {
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
    website: {
        id: string;
        url: string;
        type: "URL" | "HEARTBEAT";
        user_id: string;
        escalationSteps: {
            id: string;
            type: "EMAIL" | "SMS" | "CALL" | "PUSH";
            value: string;
            order: number;
        }[];
    };
    events: IncidentEvent[];
}

export async function getIncidents(token: string) {
    const response = await axios.get(`${API_BASE_URL}/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.incidents;
}

export async function getIncidentDetails(id: string, token: string): Promise<IncidentWithDetails> {
    const response = await axios.get(`${API_BASE_URL}/incidents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.incident;
}

export async function acknowledgeIncident(id: string, token: string): Promise<{ incident: IncidentWithDetails }> {
    const response = await axios.post(`${API_BASE_URL}/incidents/${id}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}
