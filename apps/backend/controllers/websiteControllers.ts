import { client } from "@repo/db/client"
import type { Request, Response } from "express";
import got from "got";
import { xAddAlert } from "@redis-stream/index";

export async function postwebsiteDetails(req: Request, res: Response): Promise<void> {
  try {
    const { url, escalationSteps } = req.body;
    if (!url) {
      res.status(411).json({ message: "URL is required" });
      return;
    }

    // 1. Create the website in DB
    const website = await client.website.create({
      data: {
        url,
        timeAdded: new Date(),
        user_id: req.userId as string,
        escalationSteps: escalationSteps ? {
          create: escalationSteps.map((step: any) => ({
            type: step.type,
            value: step.value,
            order: step.order
          }))
        } : undefined
      },
      include: {
        escalationSteps: true
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
        escalationSteps: true,
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

export async function acknowledgeIncident(req: Request, res: Response): Promise<void> {
  try {
    const { incidentId } = req.params;
    const incident = await client.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      res.status(404).json({ message: "Incident not found" });
      return;
    }

    if (incident.status === "RESOLVED") {
      res.status(400).json({ message: "Incident already resolved" });
      return;
    }

    const updatedIncident = await client.incident.update({
      where: { id: incidentId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: req.userId as string
      }
    });

    res.status(200).json(updatedIncident);
  } catch (error) {
    console.error("Error acknowledging incident:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendTestAlert(req: Request, res: Response): Promise<void> {
  try {
    const { websiteId } = req.params;

    const website = await client.website.findUnique({
      where: {
        id: websiteId,
        user_id: req.userId as string
      }
    });

    if (!website) {
      res.status(404).json({ message: "Website not found" });
      return;
    }

    // Publish Test Alert to Redis
    await xAddAlert({
      websiteId: website.id,
      alertType: "TEST_ALERT",
      url: website.url
    });

    res.status(200).json({ message: "Test alert triggered" });
  } catch (error) {
    console.error("Error triggering test alert:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteWebsite(req: Request, res: Response): Promise<void> {
  try {
    const { websiteId } = req.params;

    // Verify ownership
    const website = await client.website.findUnique({
      where: {
        id: websiteId,
        user_id: req.userId as string
      }
    });

    if (!website) {
      res.status(404).json({ message: "Website not found or access denied" });
      return;
    }

    // Delete related data manually (simulating cascade)
    // 1. Ticks
    await client.websiteTick.deleteMany({
      where: { website_id: websiteId }
    });

    // 2. Incidents
    await client.incident.deleteMany({
      where: { website_id: websiteId }
    });

    // 3. Escalation Steps
    await client.escalationStep.deleteMany({
      where: { website_id: websiteId }
    });

    // 4. Delete Website
    await client.website.delete({
      where: { id: websiteId }
    });

    res.status(200).json({ message: "Monitor deleted successfully" });
  } catch (error) {
    console.error("Error deleting website:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
