import { createClient } from "redis";
import type { message, WebsiteData } from "./types";
// import { client } from "@repo/db/client"


const stream_name = "betterstack:websites"
const client = await createClient({ url: "redis://localhost:6379" })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

const xAdd = async ({ url, id }: WebsiteData) => {
    return await client.xAdd(stream_name, '*', {
        url,
        id
    })
}

export const xAddBulk = async (websites: WebsiteData[]) => {
    // console.log(websites);
    
    for (let i = 0; i < websites.length; i++) {
        // console.log({ url: websites[i].url, id: websites[i].id });
        return await xAdd({ url: websites[i].url, id: websites[i].id });
    }
}

export const xReadGroup = async (consumer_group: string, workerId: string):Promise<message[] | undefined> => {
    const result = await client.xReadGroup(
        consumer_group, workerId, {
        key: stream_name,
        id: ">"
    }, {
        'COUNT': 5
    })
    if(!result){
        console.log(result);
        
        throw new Error("messages not found")
    }
// @ts-ignore
    let messages :message[] | undefined = result[0].messages;
    console.log(messages);

    return messages
}

const xAck = async (consumer_group: string, eventId: string) => {
    await client.xAck(stream_name, consumer_group, eventId)
}
export const xAckBulk = async (consumer_group: string, eventIds: string[]) => {
    eventIds.map(eventId => xAck(consumer_group, eventId));
}