import { client } from "@repo/db/client"
import type { Request, Response } from "express";
import { authClient } from "../types";
import jwt from "jsonwebtoken"
export async function signIn(req: Request, res: Response) {
  try {
    const data = authClient.safeParse(req.body);


    if (!data.success) {
      res.status(403).json({ msg: "Invalid data" });
      return;
    }

    const user = await client.user.findFirst({
      where: {
        name: data.data.name,
      }
    })

    if (user?.password !== data.data.password) {
      res.status(403).json({ msg: "Invalid password" });
      return;
    }

    const token = jwt.sign({
      sub: user.id
    }, process.env.JWT_SECRET!);

    return res.status(201).json({ jwt: token });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function signUp(req: Request, res: Response) {
  try {
    const data = authClient.safeParse(req.body);



    if (!data.success) {
      res.status(403).json({ msg: "Invalid data" });
      return;
    }

    const user = await client.user.findUnique({
      where: {
        name: data.data.name
      }
    })

    if (user) {
      res.status(403).json({ msg: "User already exists" });
      return;
    }

    const newUser = await client.user.create({
      data: {
        name: data.data.name,
        password: data.data.password,
        email: data.data.email,
        phoneNumber: data.data.phoneNumber
      }
    })

    const token = jwt.sign({
      sub: newUser.id
    }, process.env.JWT_SECRET!);

    return res.status(201).json({ jwt: token, id: newUser.id });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserDetails(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await client.user.findUnique({
      where: {
        id: userId as string
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}
