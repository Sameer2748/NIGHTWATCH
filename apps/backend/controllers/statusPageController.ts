import { client } from "@repo/db/client";
import type { Request, Response } from "express";

export async function createStatusPage(req: Request, res: Response): Promise<void> {
    try {
        const { name, slug, description, monitorIds } = req.body;

        if (!name || !slug) {
            res.status(400).json({ message: "Name and Slug are required" });
            return;
        }

        // Check unique slug
        const existing = await client.statusPage.findUnique({ where: { slug } });
        if (existing) {
            res.status(409).json({ message: "Slug already exists" });
            return;
        }

        const statusPage = await client.statusPage.create({
            data: {
                name,
                slug,
                description,
                user_id: req.userId as string,
                monitors: {
                    connect: monitorIds?.map((id: string) => ({ id })) || []
                }
            },
            include: {
                monitors: true
            }
        });

        res.status(201).json(statusPage);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getStatusPages(req: Request, res: Response): Promise<void> {
    try {
        const pages = await client.statusPage.findMany({
            where: { user_id: req.userId as string },
            include: {
                _count: {
                    select: { monitors: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(pages);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getStatusPageDetails(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const page = await client.statusPage.findUnique({
            where: { id, user_id: req.userId as string },
            include: {
                monitors: true
            }
        });

        if (!page) {
            res.status(404).json({ message: "Status page not found" });
            return;
        }

        res.status(200).json(page);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteStatusPage(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        await client.statusPage.delete({
            where: { id, user_id: req.userId as string }
        });
        res.status(200).json({ message: "Status page deleted" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPublicStatusPage(req: Request, res: Response): Promise<void> {
    try {
        const { slug } = req.params;

        const page = await client.statusPage.findUnique({
            where: { slug },
            include: {
                monitors: {
                    include: {
                        ticks: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!page) {
            res.status(404).json({ message: "Status page not found" });
            return;
        }

        // Calculate uptime for each monitor (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const monitorsWithUptime = await Promise.all(
            page.monitors.map(async (monitor) => {
                // Get all ticks for the last 90 days
                const ticks = await client.websiteTick.findMany({
                    where: {
                        website_id: monitor.id,
                        createdAt: { gte: ninetyDaysAgo }
                    },
                    select: {
                        status: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'asc' }
                });

                // Calculate daily uptime for last 90 days
                const dailyData = [];
                for (let i = 89; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);

                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);

                    // Get ticks for this specific day
                    const dayTicks = ticks.filter(t => {
                        const tickDate = new Date(t.createdAt);
                        return tickDate >= date && tickDate < nextDay;
                    });

                    if (dayTicks.length === 0) {
                        // No data for this day = assume operational
                        dailyData.push({
                            date: date.toISOString(),
                            status: 'Up',
                            uptimePercentage: 100
                        });
                    } else {
                        const upCount = dayTicks.filter(t => t.status === 'Up').length;
                        const uptimePercentage = (upCount / dayTicks.length) * 100;

                        dailyData.push({
                            date: date.toISOString(),
                            status: uptimePercentage >= 99 ? 'Up' : uptimePercentage >= 50 ? 'Degraded' : 'Down',
                            uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
                            downMinutes: Math.round(((dayTicks.length - upCount) * 3) / 60) // Assuming 3min check interval
                        });
                    }
                }

                // Overall uptime percentage
                const totalTicks = ticks.length;
                const upTicks = ticks.filter(t => t.status === 'Up').length;
                const overallUptimePercentage = totalTicks > 0 ? (upTicks / totalTicks) * 100 : 100;

                return {
                    id: monitor.id,
                    url: monitor.url,
                    currentStatus: monitor.ticks[0]?.status || 'Unknown',
                    uptimePercentage: overallUptimePercentage.toFixed(2),
                    dailyData: dailyData
                };
            })
        );

        res.status(200).json({
            name: page.name,
            description: page.description,
            monitors: monitorsWithUptime
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}
