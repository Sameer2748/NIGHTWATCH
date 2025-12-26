import axios from "axios"
import {beforeAll, describe, expect, it} from "bun:test"
import { createUser } from "./testUtils";
import { base_url } from "./config";



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
        url:"http://avadhi.pro/"  
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
            url:"http://avadhi.pro/"  
        }, {
          headers: {
            Authorization: `${userJwt}`
          }
        })
      
        expect(res.data.id).not.toBeNull();
     
  })
})

 
describe("website get details", ()=>{
  let userJwt1: string;
  let userJwt2: string;
  let userId1: string;
  let userId2: string;
  beforeAll(async()=>{
    const {id: userIdValue, jwt: userJwtValue} = await createUser();
    userJwt1 = userJwtValue;
    userId1 = userIdValue;
    const {id: userIdValue2, jwt: userJwtValue2} = await createUser();
    userJwt2 = userJwtValue2;
    userId2 = userIdValue2;
  })
  it("Website created if url is present", async()=>{
    const res = await axios.post(`${base_url}/website`, {
        url:"http://avadhi.pro/"  
    }, {
      headers: {
        Authorization: `${userJwt1}`
      }
    })
  
    expect(res.data.id).not.toBeNull();
    

    const res2 = await axios.get(`${base_url}/website/${res.data.id}`, {
      headers: {
        Authorization: `${userJwt1}` 
      }
    })
    
    
    expect(res2.data.id).not.toBeNull();
    expect(res2.data.url).not.toBeNull();
    expect(res2.data.user_id).not.toBeNull();

 
})
 
})  