import { Twilio } from "twilio";
import { config } from "dotenv";
config();

async function testTwilio() {
    try {
        const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


        const call = await client.calls.create({
            twiml: '<Response><Say>This is a test call from Night Watch.</Say></Response>',
            to: '+919518074060', // Replace with your number
            from: process.env.TWILIO_PHONE_NUMBER
        });

    } catch (e) {
    }
}

testTwilio();
