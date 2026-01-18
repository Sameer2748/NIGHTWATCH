import { Twilio } from "twilio";
import { config } from "dotenv";
config();

async function testTwilio() {
    try {
        const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
        console.log("Token:", process.env.TWILIO_AUTH_TOKEN ? "******" : "MISSING");
        console.log("From:", process.env.TWILIO_PHONE_NUMBER);

        const call = await client.calls.create({
            twiml: '<Response><Say>This is a test call from Night Watch.</Say></Response>',
            to: '+919518074060', // Replace with your number
            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log("Call SID:", call.sid);
    } catch (e) {
        console.error("Twilio Error:", e);
    }
}

testTwilio();
