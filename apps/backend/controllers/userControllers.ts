import {client} from "@repo/db/client"
import type { Request, Response } from "express";
import { authClient } from "../types";
import jwt from "jsonwebtoken"
export async function signIn(req: Request, res:Response) {
    try {
      const data = authClient.safeParse(req.body);
      console.log(data);
      

      if(!data.success){
        res.status(403).json({msg:"Invalid data"});
        return;
      }

        const user = await client.user.findFirst({
            where:{
                name:data.data.name,
            }
            })

            if(user?.password !== data.data.password){
                res.status(403).json({msg:"Invalid password"});
                return;
            }

            const token = jwt.sign({
                sub:user.id
            }, process.env.JWT_SECRET!);

      return res.status(201).json({jwt: token});

    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  export async function signUp(req:Request, res:Response) {
    try {
        const data = authClient.safeParse(req.body);

        

        if(!data.success){
          res.status(403).json({msg:"Invalid data"});
          return;
        }

        const user = await client.user.findUnique({
            where:{
                name: data.data.name
            }
        })

        if(user){
          res.status(403).json({msg:"User already exists"});
          return;
        }

        const newUser = await client.user.create({
            data:{
                name: data.data.name,
                password: data.data.password
            }
        })

        return res.status(201).json({id: newUser.id});
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  
