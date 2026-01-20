import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

export interface StatusPage {
    id: string;
    name: string;
    slug: string;
    description?: string;
    monitors?: any[];
    _count?: {
        monitors: number;
    };
    createdAt: string;
}

export interface CreateStatusPageRequest {
    name: string;
    slug: string;
    description?: string;
    monitorIds: string[];
}

export const getStatusPages = async (token: string): Promise<StatusPage[]> => {
    const response = await axios.get(`${API_URL}/status-page`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getStatusPageDetails = async (id: string, token: string): Promise<StatusPage> => {
    const response = await axios.get(`${API_URL}/status-page/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createStatusPage = async (data: CreateStatusPageRequest, token: string): Promise<StatusPage> => {
    const response = await axios.post(`${API_URL}/status-page`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteStatusPage = async (id: string, token: string): Promise<void> => {
    await axios.delete(`${API_URL}/status-page/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
