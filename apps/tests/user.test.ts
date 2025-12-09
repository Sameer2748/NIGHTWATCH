import axios from "axios"
import {describe, expect, it} from "bun:test"
import { base_url } from "./config"

// const base_url = "http://localhost:3000/api/v1"
// const base_url = "http://localhost:3002"
const USER_NAME = Math.random().toString(36).substring(2, 15)


describe("signup", ()=>{
   
  it("user not created if data is not present", async()=>{
    try {   
        await axios.post(`${base_url}/users/user/signup`, {
    
        })
        expect(false, "user created when it shouldn't")
    } catch (error: any) {
        console.log(error.response.status);
        expect(error.response.status).toBe(403);
    }
  })
  it("user created if name and password is present", async()=>{
        const res = await axios.post(`${base_url}/users/user/signup`, {
            name:USER_NAME,
            password:"sameer123"
        })
      
        expect(res.data.id).not.toBeNull();
     
  })
})
describe("signin", ()=>{
  it("user not present", async()=>{
    try {
        await axios.post(`${base_url}/users/user/signin`, {
    
        })
        expect(false, "user created when it shouldn't")
    } catch (error: any) {
        console.log(error.response.status);
        expect(error.response.status).toBe(403);
    }
  })
  it("user signed in  if name and password is present", async()=>{
        const res = await axios.post(`${base_url}/users/user/signin`, {
            name:USER_NAME,
            password:"sameer123"
        })
      
        expect(res.data.id).not.toBeNull();
     
  })
})

 