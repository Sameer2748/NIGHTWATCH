import { xAckBulk, xReadGroup } from "@redis-stream/index";
import axios from "axios"
import { client } from "@repo/db/client"

const regionId = process.env.REGION_ID! || "2ef5b219-6310-45c1-97ba-21f5ca2953cd";
const workerId = process.env.WORKER_ID! || "2";

if (!regionId || !workerId) {
    throw new Error("either one wrokerid or regionid not provided ")
}

async function main() {
    // get the stream 
    while(1){
    const response = await xReadGroup(regionId, workerId);
    // process it and send the response to another queue for bulk pushing in db 
    
    if(!response){
        continue;
    }

    let promises = response.map(async ({  message }) => processWebsites(message.url, message.id));

    await Promise.all(promises);
    console.log(promises.length);
    

    // acknowledegement of the website whcih we checked if process or not and send back to queue so send it again or mark as not processed using that timeframe id we get 
    xAckBulk(regionId, response.map(({id})=> id));
    }
}

const processWebsites = async(url:string, websiteId: string)=>{
    return new Promise<void>((resolve, reject)=>{
        const startTime = Date.now();

         axios.get(url).
         then(async () => {
            const endTime = Date.now();
            await client.websiteTick.create({
                data: {
                    response_time_ms: endTime - startTime,
                    status : "Up",
                    region_id : regionId,
                    website_id : websiteId,
                }
            })
            resolve();
        }).catch(async() => {
            const endTime = Date.now();
            await client.websiteTick.create({
                data: {
                    response_time_ms: endTime - startTime,
                    status : "Down",
                    region_id : regionId,
                    website_id : websiteId,
                }
            })
            resolve();

        })
    })

}

main();

