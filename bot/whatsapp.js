const { Client, LocalAuth } = require("whatsapp-web.js");

const qrcode = require("qrcode-terminal");

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./sessions"
    }),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox"]
    }
});

client.on("qr", (qr) => {
    console.log("Scan QR Code Below:");

    qrcode.generate(qr, {
        small: true
    });
});

client.on("ready", () => {
    console.log("WhatsApp Bot Ready!");
});

client.initialize();

module.exports = client;