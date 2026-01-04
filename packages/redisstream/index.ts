import { createClient } from "redis";
import type { message, WebsiteData } from "./types";

const client = await createClient({ url: "redis://localhost:6379" })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

// Get stream name for a specific region
const getStreamName = (regionId: string) => `betterstack:websites:${regionId}`;

const xAdd = async (regionId: string, { url, id }: WebsiteData) => {
    return await client.xAdd(getStreamName(regionId), '*', {
        url,
        id
    })
}

export const xAddBulk = async (regionId: string, websites: WebsiteData[]) => {
    const promises = websites.map(w => xAdd(regionId, w));
    return await Promise.all(promises);
}

// Initialize consumer group - call this before reading
export const initConsumerGroup = async (regionId: string, consumer_group: string) => {
    const streamName = getStreamName(regionId);
    try {
        // Try to create the consumer group
        // MKSTREAM creates the stream if it doesn't exist
        await client.xGroupCreate(streamName, consumer_group, '0', {
            MKSTREAM: true
        });
        console.log(`Consumer group '${consumer_group}' created for region '${regionId}'`);
    } catch (error: any) {
        // BUSYGROUP means the group already exists, which is fine
        if (error.message?.includes('BUSYGROUP')) {
            console.log(`Consumer group '${consumer_group}' already exists for region '${regionId}'`);
        } else {
            console.error(`Error creating consumer group:`, error);
            throw error;
        }
    }
}

export const xReadGroup = async (regionId: string, consumer_group: string, workerId: string): Promise<message[] | undefined> => {
    const streamName = getStreamName(regionId);
    try {
        const result = await client.xReadGroup(
            consumer_group, workerId, {
            key: streamName,
            id: ">"
        }, {
            'COUNT': 5,
            'BLOCK': 1000 // Block for 1 second if no data
        })

        if (!result) {
            return [];
        }

        // @ts-ignore
        let messages: message[] | undefined = result[0].messages;
        return messages;
    } catch (error) {
        console.error("Error reading from Redis group:", error);
        return [];
    }
}

const xAck = async (regionId: string, consumer_group: string, eventId: string) => {
    const streamName = getStreamName(regionId);
    try {
        await client.xAck(streamName, consumer_group, eventId)
    } catch (error) {
        console.error(`Error acknowledging event ${eventId}:`, error);
    }
}

export const xAckBulk = async (regionId: string, consumer_group: string, eventIds: string[]) => {
    await Promise.all(eventIds.map(eventId => xAck(regionId, consumer_group, eventId)));
}