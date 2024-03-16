const express = require('express')
const router = express.Router()
const registermodel = require("../models/registermodel")
const adminModel= require("../models/adminmodel")
const auditModel = require("../models/auditmodel")

const bcrypt = require("bcryptjs")
const nodemailer = require("nodemailer")
const crypto = require("crypto")
const { CLIENT_RENEG_LIMIT } = require('tls')

const hashFunction=async(pass)=>{
    const salt=await bcrypt.genSalt(10)
    return bcrypt.hash(pass,salt)
}

router.post("/signup", async (req, res) => {
    let data = req.body;
    let password = data.password;
    let confirm_password = data.confirm_password;

    if (confirm_password !== password) {
        return res.json({
            status: "password not match"
        });
    }

    try {
        // Check if the email already exists in the database
        const existingUser = await registermodel.findOne({ email: data.email });
        if (existingUser) {
            return res.json({
                status: "Email already exists"
            });
        }

        // Hash the password before saving
        let hashedPassword = await hashFunction(password);
        data.password = hashedPassword;

        // Create a new user instance
        let newUser = new registermodel(data);

        // Save the new user to the database
        await newUser.save();

        // Send email to the user
        const transporter = nodemailer.createTransport({
            service: 'vijaykrishnanpr2002@gmail.com', // e.g., 'gmail'
            auth: {
                user: 'vijaykrishnanpr2002@gmail.com',
                pass: 'facq vjwp hvgb tunu'
            }
        });

        const mailOptions = {
            from: 'vijaykrishnanpr2002@gmail.com',
            to: data.email,
            subject: 'Welcome to Our Application',
            text: 'Thank you for signing up!'
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        return res.json({
            status: "success"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
//signin
router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin is logging in
        if (email === adminemail && password === adminpassword) {
            return res.json({ status: "admin login successful" });
        }

        // Check if user is admin
        let data = await adminModel.findOne({ email: email });
        if (data) {
            const match = await bcrypt.compare(password, data.password);
            if (match) {
                return res.json({ status: "admin login successful", data: data });
            } else {
                return res.json({ status: "invalid password" });
            }
        }

        // Check if user is normal
        let registerdata = await registermodel.findOne({ email: email });
        if (registerdata) {
            const match = await bcrypt.compare(password, registerdata.password);
            if (match) {
                return res.json({ status: "resgister login successful", data: registerdata });
            } else {
                return res.json({ status: "invalid password" });
            }
        }

        // Check if user is audit
        let auditdata = await auditModel.findOne({ email: email });
        if (auditdata) {
            const match = await bcrypt.compare(password, auditdata.password);
            if (match) {
                return res.json({ status: "Audit login successful", data: auditdata });
            } else {
                return res.json({ status: "invalid password" });
            }
        }

        // No user found with the provided email
        return res.json({ status: "invalid user" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//forgot password
router.post("/forgotpassword", async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await registermodel.findOne({ email });

        // If user does not exist, return error
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate password reset token
        const resetToken = crypto.randomBytes(20).toString("hex");

        // Set token expiration (1 hour)
        const tokenExpiration = Date.now() + 3600000; // 1 hour in milliseconds

        // Update user with reset token and token expiration
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        // Send password reset email
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // SMTP server host
            port: 587, // SMTP server port (typically 587 for TLS or 465 for SSL)
            secure: false, // true for 465, false for other ports
            auth: {
              user: 'vijaykrishnanpr2002@gmail.com', // Your email address
              pass: 'facq vjwp hvgb tunu', // Your email password
            },
        });

        const mailOptions = {
            from: "vijaykrishnanpr2002@gmail.com",
            to: user.email,
            subject: "Password Reset",
            text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n`
                + `Please click on the following link, or paste this into your browser to complete the process:\n\n`
                + `http://${req.headers.host}/resetpassword/${resetToken}\n\n`
                + `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Failed to send password reset email" });
            } else {
                console.log("Email sent: " + info.response);
                return res.status(200).json({ message: "Password reset email sent" });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// Define a route for password reset via link
router.get("/resetpassword/:resetToken", async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { resetToken } = req.params;
        

        // Find user by reset token
        const user = await registermodel.findOne({ resetPasswordToken: resetToken });
        

        // If user does not exist or token is expired, return error
        if (!user || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Check if password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router