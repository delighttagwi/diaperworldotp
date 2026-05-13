const express = require("express");

const router = express.Router();

const otpStore = require("../utils/otpStore");

const whatsappClient = require("../bot/whatsapp");


// SEND OTP
router.post("/send-otp", async(req, res) => {

    try {

        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone required"
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Save OTP
        otpStore[phone] = otp;

        // WhatsApp ID format
        const chatId = phone + "@c.us";

        // Send Message
        await whatsappClient.sendMessage(
            chatId,
            `Your OTP code is: ${otp}`
        );

        res.json({
            success: true,
            message: "OTP sent"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });

    }

});


// VERIFY OTP
router.post("/verify-otp", (req, res) => {

    const { phone, otp } = req.body;

    const savedOTP = otpStore[phone];

    if (savedOTP == otp) {

        delete otpStore[phone];

        return res.json({
            success: true,
            message: "OTP verified"
        });

    }

    res.status(401).json({
        success: false,
        message: "Invalid OTP"
    });

});

module.exports = router;