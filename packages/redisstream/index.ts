import { createClient, type RedisClientType } from "redis";
import type { message, WebsiteData } from "./types";

let client: RedisClientType | null = null;

async function getClient() {
    if (!client) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        client = createClient({ url: redisUrl });
        client.on("error", (err) => console.log("Redis Client Error", err));
        await client.connect();
    }
    return client;
}

// Get stream name for a specific region
const getStreamName = (regionId: string) => `betterstack:websites:${regionId}`;

export const xAddBulk = async (regionId: string, websites: WebsiteData[]) => {
    const c = await getClient();
    const streamName = getStreamName(regionId);
    const promises = websites.map(w => c.xAdd(streamName, '*', w as any));
    return await Promise.all(promises);
}

export const xAddAlert = async (alert: { websiteId: string, incidentId?: string, alertType: string, url: string, message?: string }) => {
    const c = await getClient();
    return await c.xAdd('betterstack:alerts', '*', alert as any);
}

// Initialize consumer group - call this before reading
export const initConsumerGroup = async (stream: string, consumer_group: string) => {
    const c = await getClient();
    const streamName = stream.includes(':') ? stream : getStreamName(stream);
    try {
        // MKSTREAM creates the stream if it doesn't exist
        await c.xGroupCreate(streamName, consumer_group, '$', {
            MKSTREAM: true
        });
        console.log(`Consumer group '${consumer_group}' created for ${streamName}`);
    } catch (error: any) {
        if (error.message?.includes('BUSYGROUP')) {
            console.log(`Consumer group '${consumer_group}' already exists for ${streamName}.`);
        } else {
            console.error(`Error with consumer group:`, error);
            throw error;
        }
    }
}

export const xReadAlerts = async (consumer_group: string, workerId: string): Promise<any[]> => {
    const c = await getClient();
    const streamName = 'betterstack:alerts';
    try {
        const result = await c.xReadGroup(
            consumer_group, workerId, {
            key: streamName,
            id: ">"
        }, {
            'COUNT': 10,
            'BLOCK': 2000
        })

        if (!result || result.length === 0) return [];

        return result[0]?.messages || [];
    } catch (error: any) {
        console.error("Error reading from Alerts stream:", error.message);
        return [];
    }
}

export const xAckAlert = async (consumer_group: string, eventIds: string[]) => {
    if (eventIds.length === 0) return;
    const c = await getClient();
    try {
        await (c as any).xAck('betterstack:alerts', consumer_group, ...eventIds);
    } catch (error: any) {
        console.error(`Error acknowledging alerts:`, error.message);
    }
}

export const xReadGroup = async (regionId: string, consumer_group: string, workerId: string): Promise<message[] | undefined> => {
    const c = await getClient();
    const streamName = getStreamName(regionId);
    try {
        const result = await c.xReadGroup(
            consumer_group, workerId, {
            key: streamName,
            id: ">"
        }, {
            'COUNT': 50, // Slightly smaller batches for more frequent ACKs
            'BLOCK': 2000
        })

        if (!result || result.length === 0) return [];

        const messages = result[0]?.messages;
        if (messages && messages.length > 0) {
            console.log(`[xReadGroup] Read ${messages.length} messages from ${streamName}`);
        }
        return (messages || []) as message[];
    } catch (error: any) {
        console.error("Error reading from Redis group:", error.message);
        return [];
    }
}

export const xAckBulk = async (regionId: string, consumer_group: string, eventIds: string[]) => {
    if (eventIds.length === 0) return;
    const c = await getClient();
    const streamName = getStreamName(regionId);
    try {
        await (c as any).xAck(streamName, consumer_group, ...eventIds);
    } catch (error: any) {
        console.error(`Error acknowledging events:`, error.message);
    }
}

// Global Publish / Subscribe
export const publish = async (channel: string, data: any) => {
    const c = await getClient();
    try {
        await c.publish(channel, JSON.stringify(data));
    } catch (error: any) {
        console.error(`Error publishing to Redis channel ${channel}:`, error.message);
    }
}

export const createSubscriber = async () => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const subClient = createClient({ url: redisUrl });
    subClient.on("error", (err) => console.log("Redis Subscriber Error", err));
    await subClient.connect();
    return subClient;
}