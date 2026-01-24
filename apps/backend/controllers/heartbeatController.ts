import { client } from "@repo/db/client";
import { publish } from "@redis-stream/index";
import type { Request, Response } from "express";

export const handleHeartbeat = async (req: Request, res: Response) => {
    try {
        const { monitorId } = req.params;

        if (!monitorId) {
            return res.status(400).json({ msg: "Monitor ID required" });
        }

        const monitor = await client.website.findUnique({
            where: { id: monitorId }
        });

        if (!monitor) {
            return res.status(404).json({ msg: "Monitor not found" });
        }

        if (monitor.type !== "HEARTBEAT") {
            return res.status(400).json({ msg: "Not a heartbeat monitor" });
        }

        // Update last heartbeat time
        await client.website.update({
            where: { id: monitorId },
            data: { last_heartbeat: new Date() }
        });

        // Use a default region (India) for now
        // Ideally fetch this constant from a shared config
        const regionId = "india-region-id";

        // Create UP tick
        const tick = await client.websiteTick.create({
            data: {
                website_id: monitorId,
                status: "Up",
                response_time_ms: 0,
                region_id: regionId,
                message: "Heartbeat received"
            }
        });

        // Publish Tick Update
        await publish(`monitor:${monitorId}:updates`, { type: 'TICK', data: tick });

        // Check for ONGOING incident to resolve
        const ongoingIncident = await client.incident.findFirst({
            where: { website_id: monitorId, status: "ONGOING" }
        });

        if (ongoingIncident) {
            const duration = Math.floor((Date.now() - new Date(ongoingIncident.startedAt).getTime()) / 1000);
            const resolved = await client.incident.update({
                where: { id: ongoingIncident.id },
                data: { status: "RESOLVED", resolvedAt: new Date(), duration }
            });
            await publish(`monitor:${monitorId}:updates`, { type: 'INCIDENT_RESOLVED', data: resolved });
        }

        return res.status(200).json({ msg: "Heartbeat received" });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ msg: "Internal server error" });
    }
};
