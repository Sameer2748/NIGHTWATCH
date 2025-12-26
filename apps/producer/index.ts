import { client } from "@repo/db/client"
import {xAddBulk} from "@redis-stream/index";

async function main() {
    const websites = await client.website.findMany({
        select:{
            url:true,
            id:true
        }
    })
    console.log(websites.length);
    

    const res = await xAddBulk(websites.map(w=> ({url:w.url, id: w.id})));
    console.log(res);
    
    
}
setInterval(()=>{
main()
},3 * 1000 )

main()