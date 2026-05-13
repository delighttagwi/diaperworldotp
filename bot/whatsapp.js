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
        // More aggressive memory management flags
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process", 
            "--disable-gpu",
            "--hide-scrollbars",
            "--disable-notifications",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-breakpad",
            "--disable-component-extensions-with-background-pages",
            "--disable-extensions",
            "--disable-features=TranslateUI,BlinkGenPropertyTrees",
            "--disable-ipc-flooding-protection",
            "--disable-renderer-backgrounding",
            "--enable-features=NetworkService,NetworkServiceInProcess",
            "--force-color-profile=srgb",
            "--metrics-recording-only",
            "--mute-audio"
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
    botStatus.qr = null; 
    console.log("WhatsApp Bot Ready!");
});

// Handle disconnection or crash
client.on("disconnected", (reason) => {
    botStatus.connected = false;
    console.log("WhatsApp Bot Disconnected:", reason);
    // Attempt to re-initialize if it wasn't a manual logout
    try {
        client.initialize();
    } catch (e) {
        console.error("Re-initialization failed:", e);
    }
});

client.initialize().catch(err => console.error("Initial load error:", err));

// Export both the client and a safer status getter
module.exports = { 
    client, 
    getBotStatus: () => {
        // Double check if the internal browser page is actually alive
        const isBrowserAlive = client.pupPage && !client.pupPage.isClosed();
        return {
            connected: botStatus.connected && isBrowserAlive,
            qr: botStatus.qr
        };
    } 
};
