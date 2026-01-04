import { client } from "@repo/db/client"
import type { Request, Response } from "express";

export async function postwebsiteDetails(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body.url) {
      res.status(411).json({});
      return;
    }

    const website = await client.website.create({
      data: {
        url: req.body.url,
        timeAdded: new Date(),
        user_id: req.userId as string
      }
    })

    res.status(201).json(website);
    return;
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}
export async function getAllWebsites(req: Request, res: Response): Promise<void> {
  try {
    const websites = await client.website.findMany({
      where: {
        user_id: req.userId as string
      },
      include: {
        ticks: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        timeAdded: 'desc'
      }
    });

    res.status(200).json(websites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getwebsiteDetails(req: Request, res: Response): Promise<void> {
  try {
    const websiteId = req.params.websiteId;
    const regionId = req.query.region_id as string | undefined;

    const website = await client.website.findUnique({
      where: {
        user_id: req.userId as string,
        id: websiteId
      },
      include: {
        ticks: {
          where: regionId ? {
            region_id: regionId
          } : undefined,
          orderBy: {
            createdAt: "desc"
          },
          take: 100
        },
        incidents: {
          where: regionId ? {
            region_id: regionId
          } : undefined,
          orderBy: {
            startedAt: "desc"
          }
        }
      }
    })

    if (!website) {
      res.status(404).json({ message: "Website not found" });
      return;
    }
    res.status(200).json(website);
    return;
  } catch (error) {
    console.error("Error getting website details:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}
