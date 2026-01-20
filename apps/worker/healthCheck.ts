import got from "got";
import { notifyMasterSystemDown } from "./notificationService";

export const MASTER_CONTACT = {
    phone: "9518074060",
    email: "mrao27488@gmail.com"
};

const HEALTH_CHECK_ENDPOINTS = [
    "https://1.1.1.1",
    "https://8.8.8.8",
    "https://www.google.com"
];

let lastHealthCheckTime = 0;
let lastHealthCheckResult = true;
let previousHealthState = true;
const HEALTH_CHECK_CACHE_MS = 60000;

/**
 * Check if Nightwatch monitoring service has internet connectivity
 * Returns true if we can reach the internet, false if our network is down
 */
export async function checkNightwatchHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - lastHealthCheckTime < HEALTH_CHECK_CACHE_MS) {
        return lastHealthCheckResult;
    }

    let successCount = 0;
    const requiredSuccesses = 2;

    for (const endpoint of HEALTH_CHECK_ENDPOINTS) {
        try {
            await got(endpoint, {
                timeout: { request: 5000 },
                retry: { limit: 0 }
            });
            successCount++;
            if (successCount >= requiredSuccesses) {
                break;
            }
        } catch (error) {
            continue;
        }
    }

    const isHealthy = successCount >= requiredSuccesses;

    lastHealthCheckTime = now;
    lastHealthCheckResult = isHealthy;

    return isHealthy;
}

/**
 * Send alert to master when Nightwatch state changes
 * Only alerts on transitions: healthy->unhealthy or unhealthy->healthy
 */
export async function alertMasterOnStateChange(workerId: string, regionId: string, isHealthy: boolean) {
    if (isHealthy === previousHealthState) {
        return;
    }

    previousHealthState = isHealthy;

    if (!isHealthy) {


        await notifyMasterSystemDown({
            workerId,
            regionId,
            timestamp: new Date(),
            message: "Network connectivity lost - unable to reach health check endpoints"
        });
    } else {
    }
}
