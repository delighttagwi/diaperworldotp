const express = require("express");
const router = express.Router();
const otpStore = require("../utils/otpStore");

// Destructure the client and the status function from the bot file
const { client, getBotStatus } = require("../bot/whatsapp");

/**
 * GET /auth/status
 * Used by the frontend to fetch the QR code or check connection status.
 */
router.get("/status", (req, res) => {
    res.json(getBotStatus());
});

/**
 * POST /auth/send-otp
 * Generates and sends a 6-digit code via WhatsApp.
 */
router.post("/send-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        // Validation for missing phone number
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        // 1. SESSION SAFETY CHECK: Check if the browser process is alive
        // This prevents the "Attempted to use detached Frame" crash
        if (!client || !client.pupPage || client.pupPage.isClosed()) {
            return res.status(503).json({
                success: false,
                message: "WhatsApp session lost or browser crashed. Please re-scan QR."
            });
        }

        // 2. AUTH CHECK: Check if the bot is actually logged in
        const status = getBotStatus();
        if (!status.connected) {
            return res.status(503).json({
                success: false,
                message: "WhatsApp is not connected. Please scan the QR code first.",
                qr: status.qr 
            });
        }

        // 3. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // 4. Save OTP
        otpStore[phone] = otp;

        // 5. Format the ID
        const cleanPhone = phone.replace("+", "");
        const chatId = `${cleanPhone}@c.us`;

        // 6. Send Message
        await client.sendMessage(
            chatId,
            `Your verification code is: ${otp}`
        );

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("Error in /send-otp:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send WhatsApp message. Server might be restarting."
        });
    }
});

/**
 * POST /auth/verify-otp
 * Validates the code provided by the user.
 */
router.post("/verify-otp", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: "Phone and OTP are required"
        });
    }

    const savedOTP = otpStore[phone];

    if (savedOTP && savedOTP == otp) {
        delete otpStore[phone];

        return res.json({
            success: true,
            message: "OTP verified successfully"
        });
    }

    res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
    });
});

module.exports = router;
