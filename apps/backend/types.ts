import {z} from "zod";

export const authClient = z.object({
    name:z.string(),
    password: z.string()
})