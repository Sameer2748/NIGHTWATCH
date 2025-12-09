import axios from "axios"
import {beforeAll, describe, expect, it} from "bun:test"
import { createUser } from "./testUtils";
import { base_url } from "./config";

// const base_url = "http://localhost:3000/api/v1"
// const base_url = "http://localhost:3002"


describe("website get creeated", ()=>{
  let userJwt: string;
  let userId: string;
  beforeAll(async()=>{
    const {id: userIdValue, jwt: userJwtValue} = await createUser();
    userJwt = userJwtValue;
    userId = userIdValue;
  })
  it("Website not created if url is not present", async()=>{
    try {
      const res = await axios.post(`${base_url}/website`, {
        url:"amazon.com"  
    })
        expect(res.data).toBeNull();
    } catch (error) {
        
    }
  })
  it("Website not created if url is not present", async()=>{
    try {
          await axios.post(`${base_url}/website`, {}, {
            headers: {
              Authorization: `${userJwt}`
            }
        })
        expect(false, "website created when it shouldn't")
    } catch (error) {
        
    }
  })
  it("Website created if url is present", async()=>{
        const res = await axios.post(`${base_url}/website`, {
            url:"amazon.com"  
        }, {
          headers: {
            Authorization: `${userJwt}`
          }
        })
      
        expect(res.data.id).not.toBeNull();
     
  })
})

 