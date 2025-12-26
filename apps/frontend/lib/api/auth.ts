import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface SignInRequest {
    name: string;
    password: string;
}

export interface SignInResponse {
    jwt: string;
}

export interface SignUpRequest {
    name: string;
    password: string;
}

export interface SignUpResponse {
    id: string;
}

export const authAPI = {
    signIn: async (data: SignInRequest): Promise<SignInResponse> => {
        const response = await apiClient.post<SignInResponse>('/user/signin', data);
        return response.data;
    },

    signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
        const response = await apiClient.post<SignUpResponse>('/user/signup', data);
        return response.data;
    },
};
