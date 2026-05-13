const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Variable to store the latest QR and connection status
let botStatus = {
    connected: false,
    qr: null
};

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./sessions"
    }),
    puppeteer: {
        headless: true,
        // Critical flags for Railway/Linux environments
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process", 
            "--disable-gpu"
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium"
    }
});

// When a new QR is generated
client.on("qr", (qr) => {
    botStatus.qr = qr;
    botStatus.connected = false;
    
    console.log("Scan QR Code Below:");
    qrcode.generate(qr, { small: true });
});

// When the bot successfully logs in
client.on("ready", () => {
    botStatus.connected = true;
    botStatus.qr = null; // Clear QR once connected
    console.log("WhatsApp Bot Ready!");
});

// Handle disconnection
client.on("disconnected", () => {
    botStatus.connected = false;
    console.log("WhatsApp Bot Disconnected");
});

client.initialize();

// Export both the client (for sending messages) and the status getter
module.exports = { 
    client, 
    getBotStatus: () => botStatus 
};
