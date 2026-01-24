import { Request, Response } from "express";
import { client } from "@repo/db/client";

export const getIncidents = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const incidents = await client.incident.findMany({
            where: {
                website: {
                    user_id: userId
                }
            },
            include: {
                website: {
                    select: {
                        url: true,
                        type: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ incidents });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getIncidentDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const incident = await client.incident.findUnique({
            where: { id },
            include: {
                website: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        user_id: true,
                        escalationSteps: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                events: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        if (incident.website.user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // If acknowledgedBy is a UUID, fetch the user email
        if (incident.acknowledgedBy) {
            // Check if it's a UUID (contains hyphens and is 36 chars)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incident.acknowledgedBy);

            if (isUUID) {
                const user = await client.user.findUnique({
                    where: { id: incident.acknowledgedBy }
                });

                if (user?.email) {
                    // Replace UUID with email
                    incident.acknowledgedBy = user.email;
                }
            }
        }

        res.json({ incident });
    } catch (error) {
        console.error("Error fetching incident details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const acknowledgeIncident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const incident = await client.incident.findUnique({
            where: { id },
            include: { website: true }
        });

        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        if (incident.website.user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Fetch user email for "Acknowledged By"
        const user = await client.user.findUnique({ where: { id: userId } });
        const acknowledgedByEmail = user?.email || "Unknown User";

        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(incident.startedAt).getTime()) / 1000);

        const updatedIncident = await client.incident.update({
            where: { id },
            data: {
                status: "RESOLVED",
                acknowledgedAt: now,
                acknowledgedBy: acknowledgedByEmail,
                resolvedAt: now,
                duration: duration
            }
        });

        // Add a "RESOLVED" event to the timeline
        await client.incidentEvent.create({
            data: {
                incident_id: id,
                type: "EMAIL", // Using EMAIL as a placeholder for manual ack, or add a new type pending schema update
                status: "SENT",
                value: acknowledgedByEmail,
                message: `Incident manually acknowledged and resolved by user.`
            }
        });

        res.json({ incident: updatedIncident });
    } catch (error) {
        console.error("Error acknowledging incident:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
