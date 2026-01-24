import { config } from "dotenv";
config();
import { client } from "@repo/db/client";
import { initConsumerGroup, xAckAlert, xReadAlerts } from "@redis-stream/index";
import * as Brevo from '@getbrevo/brevo';
import { Twilio } from "twilio";

const WORKER_ID = `notifier-${Math.random().toString(36).substr(2, 4)}`;

async function main() {

    try {
        await initConsumerGroup('betterstack:alerts', 'notifier-group');
    } catch (e) {
    }

    while (true) {
        try {
            const messages = await xReadAlerts('notifier-group', WORKER_ID);

            if (!messages || messages.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            for (const msg of messages) {
                const { websiteId, incidentId, alertType, url, message } = msg.message;

                if (alertType === "WEBSITE_DOWN") {
                    await handleEscalation(websiteId, incidentId, url, message);
                } else if (alertType === "TEST_ALERT") {
                    await handleTestAlert(websiteId, url);
                } else if (alertType === "SYSTEM_DOWN") {
                    await handleSystemDownAlert(url, message);
                }

                await xAckAlert('notifier-group', [msg.id]);
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function handleEscalation(websiteId: string, incidentId: string | undefined, url: string, message?: string) {
    // 1. Fetch website and its escalation steps
    const website = await client.website.findUnique({
        where: { id: websiteId },
        include: {
            escalationSteps: {
                orderBy: { order: 'asc' }
            },
            user: true
        }
    });

    if (!website) return;


    // 2. Execute steps in order
    for (const step of website.escalationSteps) {
        // Check if incident is already acknowledged or resolved
        const currentIncident = incidentId
            ? await client.incident.findUnique({ where: { id: incidentId } })
            : await client.incident.findFirst({
                where: {
                    website_id: websiteId,
                    status: "ONGOING"
                }
            });

        if (!currentIncident || currentIncident.status === 'RESOLVED' || currentIncident.acknowledgedAt) {
            break;
        }

        const targetValue = step.value === 'OWNER' ? website.user.email : step.value;
        if (!targetValue) continue;


        let eventId = '';
        if (currentIncident) {
            try {
                const event = await client.incidentEvent.create({
                    data: {
                        incident_id: currentIncident.id,
                        type: step.type,
                        value: targetValue,
                        status: 'PENDING',
                        message: `Sending ${step.type} to ${targetValue}...`
                    }
                });
                eventId = event.id;
            } catch (e) { }
        }

        try {
            switch (step.type) {
                case 'EMAIL':
                    await sendEmail(targetValue, url, message);
                    break;
                case 'SMS':
                    await sendSMS(targetValue, url, message);
                    break;
                case 'CALL':
                    await sendCall(targetValue, url);
                    break;
            }

            if (eventId) {
                await client.incidentEvent.update({
                    where: { id: eventId },
                    data: { status: 'SENT', message: `Successfully sent ${step.type} to ${targetValue}` }
                });
            }

            await new Promise(resolve => setTimeout(resolve, 5000));

            if (step.type === 'CALL') {
                break;
            }
        } catch (err: any) {
            if (eventId) {
                await client.incidentEvent.update({
                    where: { id: eventId },
                    data: { status: 'FAILED', message: err.message || 'Failed to send' }
                });
            }
        }
    }
}

async function handleTestAlert(websiteId: string, url: string) {

    const website = await client.website.findUnique({
        where: { id: websiteId },
        include: { user: true }
    });

    if (!website || !website.user?.email) {
        return;
    }

    const email = website.user.email;
    const subject = `🟢 Test Alert: ${url}`;
    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #10b981;">Test Alert Successful</h2>
            <p>This is a test alert for your monitor <strong>${url}</strong>.</p>
            <p>If you received this email, your notification settings are configured correctly.</p>
            <p style="background: #f0fdf4; padding: 10px; border-radius: 4px; border: 1px solid #bbf7d0; color: #166534;">
                <strong>Status:</strong> TEST OK<br/>
                <strong>Time:</strong> ${new Date().toLocaleString()}
            </p>
        </div>
    `;

    await sendCustomEmail(email, subject, htmlContent);
}

// Master contact for system-level alerts
const MASTER_CONTACT = {
    phone: "9518074060",
    email: "mrao27488@gmail.com"
};

async function handleSystemDownAlert(systemName: string, message?: string) {

    const subject = `🚨 CRITICAL: ${systemName} Network Down`;
    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #b91c1b; border-radius: 8px; background: #fff;">
            <div style="background: #b91c1b; color: white; padding: 20px; border-radius: 6px 6px 0 0; margin: -20px -20px 20px -20px;">
                <h1 style="margin: 0; font-size: 24px;">🚨 CRITICAL SYSTEM ALERT</h1>
            </div>
            
            <div style="background: #fef2f2; border-left: 4px solid #b91c1b; padding: 15px; margin: 20px 0;">
                <h2 style="color: #b91c1b; margin-top: 0;">${systemName}</h2>
                <p style="margin: 10px 0; color: #7f1d1d; white-space: pre-line;">
                    ${message || "System monitoring service has lost network connectivity"}
                </p>
            </div>

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Impact:</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                    <li>Website monitoring is currently <strong>unavailable</strong></li>
                    <li>No websites are being marked as "down" during this outage</li>
                    <li>This prevents false positive alerts</li>
                    <li>Normal monitoring will resume once connectivity is restored</li>
                </ul>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p style="margin: 5px 0;">This is an automated alert from <strong>Nightwatch Monitoring System</strong>.</p>
                <p style="margin: 5px 0;">Contact: ${MASTER_CONTACT.phone}</p>
            </div>
        </div>
    `;

    // Send to master email
    await sendCustomEmail(MASTER_CONTACT.email, subject, htmlContent);

    // TODO: Send SMS to master phone
}

// Helper to reuse Brevo logic
async function sendCustomEmail(email: string, subject: string, htmlContent: string) {
    if (!process.env.BREVO_API_KEY) {
        return;
    }

    try {

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { "name": "NightWatch Alerts", "email": "mrao27488@gmail.com" };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (err: any) {
    }
}



const apiInstance = new Brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

// Initialize Twilio
let twilioClient: Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendEmail(email: string, url: string, message?: string) {
    if (!process.env.BREVO_API_KEY) {
        return;
    }

    try {

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `🚨 Alert: ${url} is DOWN`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #ef4444;">Website Down Alert</h2>
                <p>Your monitor for <a href="${url}">${url}</a> has triggered an alert.</p>
                <div style="background: #fff5f5; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <strong style="color: #b91c1c;">Make sure to check:</strong>
                    <p style="margin: 5px 0 0 0; color: #7f1d1d;">${message || "No error details available"}</p>
                </div>
                <p style="background: #f1f5f9; padding: 10px; border-radius: 4px;">
                    <strong>Status:</strong> DOWN<br/>
                    <strong>Time:</strong> ${new Date().toLocaleString()}
                </p>
                <p>Please acknowledge this incident in your dashboard to stop further escalation.</p>
                <a href="http://localhost:3001/dashboard" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Dashboard</a>
            </div>
        `;
        sendSmtpEmail.sender = { "name": "NightWatch Alerts", "email": "mrao27488@gmail.com" };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    } catch (err: any) {
    }
}

async function sendSMS(phone: string, url: string, message?: string) {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        return;
    }

    try {
        const messageBody = message ? `Reason: ${message}` : '';
        const smsBody = `🚨 NightWatch Alert: ${url} is DOWN. ${messageBody} Please acknowledge immediately.`;

        const textMessage = await twilioClient.messages.create({
            body: smsBody.substring(0, 159), // Truncate to avoid multi-segment issues lightly
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
    } catch (err: any) {
    }
}

async function sendCall(phone: string, url: string) {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        return;
    }

    try {
        // Uses TwiML Bin or default text-to-speech
        const call = await twilioClient.calls.create({
            twiml: `<Response><Say>Alert from Night Watch. Your monitor for ${url.replace('https://', '')} is currently down. Please check your dashboard.</Say></Response>`,
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
    } catch (err: any) {
    }
}

main();
