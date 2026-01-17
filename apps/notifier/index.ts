import { config } from "dotenv";
config();
import { client } from "@repo/db/client";
import { initConsumerGroup, xAckAlert, xReadAlerts } from "@redis-stream/index";
import * as Brevo from '@getbrevo/brevo';
import { Twilio } from "twilio";

const WORKER_ID = `notifier-${Math.random().toString(36).substr(2, 4)}`;

async function main() {
    console.log(`[${WORKER_ID}] Notifier Service Starting...`);

    try {
        await initConsumerGroup('betterstack:alerts', 'notifier-group');
    } catch (e) {
        console.error("Failed to init consumer group for alerts:", e);
    }

    while (true) {
        try {
            const messages = await xReadAlerts('notifier-group', WORKER_ID);

            if (!messages || messages.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            for (const msg of messages) {
                console.log(`[${WORKER_ID}] Raw Msg:`, JSON.stringify(msg.message));
                const { websiteId, incidentId, alertType, url } = msg.message;
                console.log(`[${WORKER_ID}] Received Alert: ${alertType} for ${url} (Incident: ${incidentId})`);

                if (alertType === "WEBSITE_DOWN") {
                    await handleEscalation(websiteId, incidentId, url);
                } else if (alertType === "TEST_ALERT") {
                    await handleTestAlert(websiteId, url);
                }

                await xAckAlert('notifier-group', [msg.id]);
            }
        } catch (error) {
            console.error("Error in alert loop:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function handleEscalation(websiteId: string, incidentId: string | undefined, url: string) {
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

    console.log(`[Escalation] Processing ${website.escalationSteps.length} steps for ${url} ${incidentId ? `(Incident: ${incidentId})` : ''}`);

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
            console.log(`[Escalation] Alert for ${url} acknowledged or resolved. Stopping cycle.`);
            break;
        }

        const targetValue = step.value === 'OWNER' ? website.user.email : step.value;
        if (!targetValue) continue;

        console.log(`[Alert] Sending ${step.type} to ${targetValue} for ${url}`);

        try {
            switch (step.type) {
                case 'EMAIL':
                    await sendEmail(targetValue, url);
                    break;
                case 'SMS':
                    await sendSMS(targetValue, url);
                    break;
                case 'CALL':
                    await sendCall(targetValue, url);
                    break;
            }

            // Note: In a production system, we would NOT await the next step here.
            // We would schedule a background job to check for acknowledgement.
            // But to demonstrate the logic for the user, we show the sequential flow.
            console.log(`[Escalation] Step ${step.order} completed for ${targetValue}`);

            // In a real system, we'd wait here for X minutes before the next step
            // For demo purposes, we can add a small sleep or just continue
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Simulate a "stop if someone picks up" logic for calls (simplified for demo)
            if (step.type === 'CALL') {
                console.log(`[Alert] Call successful to ${targetValue}. Stopping escalation.`);
                break;
            }
        } catch (err) {
            console.error(`[Alert] Failed to send ${step.type} to ${targetValue}:`, err);
        }
    }
}

async function handleTestAlert(websiteId: string, url: string) {
    console.log(`[TestAlert] Processing test alert for ${url}`);

    const website = await client.website.findUnique({
        where: { id: websiteId },
        include: { user: true }
    });

    if (!website || !website.user?.email) {
        console.error(`[TestAlert] User email not found for website ${websiteId}`);
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

// Helper to reuse Brevo logic
async function sendCustomEmail(email: string, subject: string, htmlContent: string) {
    if (!process.env.BREVO_API_KEY) {
        console.log(`📧 [MOCK EMAIL] To: ${email} | Subject: ${subject}`);
        return;
    }

    try {
        console.log(`📧 Sending email to ${email} via Brevo...`);

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { "name": "NightWatch Alerts", "email": "mrao27488@gmail.com" };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[Email] Sent successfully. Message ID: ${JSON.stringify(data.body)}`);
    } catch (err: any) {
        console.error(`[Email] Failed to send to ${email}:`, err);
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

async function sendEmail(email: string, url: string) {
    if (!process.env.BREVO_API_KEY) {
        console.log(`📧 [MOCK EMAIL] To: ${email} | Subject: Alert: ${url} is DOWN! (Add BREVO_API_KEY to enable real emails)`);
        return;
    }

    try {
        console.log(`📧 Sending email to ${email} via Brevo...`);

        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `🚨 Alert: ${url} is DOWN`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #ef4444;">Website Down Alert</h2>
                <p>Your monitor for <a href="${url}">${url}</a> has triggered an alert.</p>
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

        console.log(`[Email] Sent successfully. Message ID: ${JSON.stringify(data.body)}`);
    } catch (err: any) {
        console.error(`[Email] Failed to send to ${email}:`, err);
    }
}

async function sendSMS(phone: string, url: string) {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`📱 [MOCK SMS] To: ${phone} | Msg: Website ${url} is DOWN! (Add TWILIO credentials to enable real SMS)`);
        return;
    }

    try {
        console.log(`📱 Sending SMS to ${phone} via Twilio...`);
        const message = await twilioClient.messages.create({
            body: `🚨 NightWatch Alert: ${url} is DOWN. Please acknowledge immediately.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        console.log(`[SMS] Sent successfully. SID: ${message.sid}`);
    } catch (err: any) {
        console.error(`[SMS] Failed to send to ${phone}:`, err);
    }
}

async function sendCall(phone: string, url: string) {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`📞 [MOCK CALL] To: ${phone} | Voice: Automated alert - ${url} is unreachable. (Add TWILIO credentials to enable real Calls)`);
        return;
    }

    try {
        console.log(`📞 Initiating Call to ${phone} via Twilio...`);
        // Uses TwiML Bin or default text-to-speech
        const call = await twilioClient.calls.create({
            twiml: `<Response><Say>Alert from Night Watch. Your monitor for ${url.replace('https://', '')} is currently down. Please check your dashboard.</Say></Response>`,
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        console.log(`[Call] Initiated successfully. SID: ${call.sid}`);
    } catch (err: any) {
        console.error(`[Call] Failed to initiate call to ${phone}:`, err);
    }
}

main();
