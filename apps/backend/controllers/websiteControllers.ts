import { client } from "@repo/db/client"
import type { Request, Response } from "express";
import got from "got";

export async function postwebsiteDetails(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(411).json({ message: "URL is required" });
      return;
    }

    // 1. Create the website in DB
    const website = await client.website.create({
      data: {
        url,
        timeAdded: new Date(),
        user_id: req.userId as string
      }
    });

    // 2. Perform an immediate initial check
    // We do this in the background so we can respond to the user quickly,
    // but the task is small enough that it won't hang the backend.
    performInitialCheck(website.url, website.id).catch(err => {
      console.error(`[InitialCheck] Failed for ${website.url}:`, err.message);
    });

    res.status(201).json(website);
    return;
  } catch (error) {
    console.error("Error creating website:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

/**
 * Performs a one-time initial check for a newly added website.
 * This ensures the user sees a "First Tick" immediately.
 */
async function performInitialCheck(url: string, websiteId: string) {
  console.log(`[InitialCheck] Checking new website: ${url}`);

  let status: "Up" | "Down" = "Up";
  let timings: any = null;

  try {
    const response = await got(url, {
      timeout: { request: 10000 },
      followRedirect: true,
      https: { rejectUnauthorized: false },
      retry: { limit: 0 }
    });
    timings = response.timings;
    status = "Up";
  } catch (error: any) {
    status = "Down";
    console.log(`[InitialCheck] ${url} is Down: ${error.message}`);
  }

  try {
    const tickData: any = {
      status,
      region_id: 'india-region-id', // Use a default region for the initial backend check
      website_id: websiteId,
      response_time_ms: timings ? Math.round(timings.phases.total || 0) : 0,
    };

    if (timings) {
      tickData.dns_time_ms = Math.round(timings.phases.dns || 0);
      tickData.tcp_time_ms = Math.round(timings.phases.tcp || 0);
      tickData.tls_time_ms = Math.round(timings.phases.tls || 0);
      tickData.ttfb_ms = Math.round(timings.phases.firstByte || 0);
      tickData.download_time_ms = Math.round(timings.phases.download || 0);
    }

    await client.websiteTick.create({ data: tickData });
    console.log(`[InitialCheck] Recorded first tick for ${url} (${status})`);
  } catch (dbError: any) {
    console.error(`[InitialCheck] DB Error saving results for ${url}:`, dbError.message);
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
          take: 1000
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
