import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "./config/database.js";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();

        const email =
            "admin@hospital.com";

        const existing =
            await User.findOne({
                email,
            });

        if (existing) {
            console.log(
                "Admin already exists."
            );
            process.exit(0);
        }

        const password =
            await bcrypt.hash(
                "Admin@123",
                12
            );

        const admin =
            await User.create({
                name: "Hospital Admin",
                email,
                mobile: "9876543210",
                password,
                role: "admin",
                status: "active",
            });

        console.log(
            "Admin created successfully."
        );

        console.log(
            "Email:",
            admin.email
        );

        console.log(
            "Password: Admin@123"
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Admin creation failed:",
            error
        );

        process.exit(1);
    }
};

createAdmin();