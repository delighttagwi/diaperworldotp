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

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        // 1. Check if the bot is actually logged in before trying to send
        const status = getBotStatus();
        if (!status.connected) {
            return res.status(503).json({
                success: false,
                message: "WhatsApp is not connected. Please scan the QR code first.",
                qr: status.qr // Send the QR back so the frontend can display it
            });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // 3. Save OTP (Consider adding an expiry time in production)
        otpStore[phone] = otp;

        // 4. Format the ID (Remove '+' if present and append @c.us)
        const cleanPhone = phone.replace("+", "");
        const chatId = `${cleanPhone}@c.us`;

        // 5. Send Message
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
            message: "Failed to send WhatsApp message"
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

    // Use == to handle potential string/number mismatches from body
    if (savedOTP && savedOTP == otp) {
        // Clear the OTP so it can't be used twice
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
