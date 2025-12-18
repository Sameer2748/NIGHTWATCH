import { createClient } from "redis";


async function main() {
    const client = await createClient({ url: "redis://localhost:6379" })
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();
    const res1 = await client.xAdd(
        'betterstack:websites', '*', {
        'url': 'google.com',
        'id': '1'
    }
    );
    console.log(res1);
    client.destroy()
}

main()