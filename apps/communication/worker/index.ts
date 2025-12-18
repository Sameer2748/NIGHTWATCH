import { createClient } from "redis";

async function main() {
    const client = await createClient({ url: 'redis://localhost:6379' }).on('error', (error) => {
        console.log("redis client err", error)
    }).connect();

    const res = await client.xReadGroup("india", "india-1", { key: "betterstack:websites", id: '>' }, { COUNT: 2 })
    // @ts-ignore
    if (!res?.[0]) {
        client.destroy()
        return
    }
    // @ts-ignore
    console.log(res[0]?.messages);
    client.destroy()
}
main();