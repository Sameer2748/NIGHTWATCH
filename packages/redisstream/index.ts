import { createClient, type RedisClientType } from "redis";
import type { message, WebsiteData } from "./types";

let client: RedisClientType | null = null;

async function getClient() {
    if (!client) {
        client = createClient({ url: "redis://localhost:6379" });
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

// Initialize consumer group - call this before reading
export const initConsumerGroup = async (regionId: string, consumer_group: string) => {
    const c = await getClient();
    const streamName = getStreamName(regionId);
    try {
        // MKSTREAM creates the stream if it doesn't exist
        await c.xGroupCreate(streamName, consumer_group, '$', {
            MKSTREAM: true
        });
        console.log(`Consumer group '${consumer_group}' created (starting from LATEST)`);
    } catch (error: any) {
        if (error.message?.includes('BUSYGROUP')) {
            console.log(`Consumer group '${consumer_group}' already exists.`);
        } else {
            console.error(`Error with consumer group:`, error);
            throw error;
        }
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