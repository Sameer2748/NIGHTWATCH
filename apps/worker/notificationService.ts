import { xAddAlert } from "@redis-stream/index";
import { MASTER_CONTACT } from "./healthCheck";

interface SystemAlert {
    workerId: string;
    regionId: string;
    timestamp: Date;
    message: string;
}

/**
 * Send system down alert to master via Redis alert stream
 * The notifier service will handle actual email/SMS delivery
 */
export async function notifyMasterSystemDown(alert: SystemAlert): Promise<void> {
    try {

        await xAddAlert({
            websiteId: "SYSTEM", 
            incidentId: `system-down-${Date.now()}`,
            alertType: "SYSTEM_DOWN",
            url: `Nightwatch Monitoring Service (${alert.regionId})`,
            message: `🚨 CRITICAL: ${alert.message}
            
Worker: ${alert.workerId}
Region: ${alert.regionId}
Time: ${alert.timestamp.toISOString()}

Action Required:
1. Check server network connectivity
2. Verify internet access
3. Check firewall/security settings
4. Restart monitoring service if needed

Contact: ${MASTER_CONTACT.phone} / ${MASTER_CONTACT.email}

This is a system-level alert. Normal monitoring will resume once connectivity is restored.`
        });

    } catch (error) {
    }
}
