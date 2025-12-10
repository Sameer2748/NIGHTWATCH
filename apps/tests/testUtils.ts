import axios from "axios"
import { base_url } from "./config"



export const createUser = async (): Promise<{id: string, jwt: string}> => {
    
    const username = Math.random().toString(36).substring(2, 15)
    const password = Math.random().toString(36).substring(2, 15)    
    const signupRes = await axios.post(`${base_url}/user/signup`, {
        name: username,
        password
    })
    const signinRes = await axios.post(`${base_url}/user/signin`, {
        name: username,
        password
    })
    return {id: signupRes.data.id, jwt: signinRes.data.jwt}
}   
