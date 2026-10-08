import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        theme: {
            type: String,
            enum: ["light", "dark", "system"],
            default: "light",
        },

        fontFamily: {
            type: String,
            enum: [
                "inter",
                "poppins",
                "roboto",
                "nunito",
                "system",
            ],
            default: "inter",
        },

        fontSize: {
            type: String,
            enum: ["small", "normal", "large"],
            default: "normal",
        },

        sidebarMode: {
            type: String,
            enum: ["expanded", "compact"],
            default: "expanded",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "UserPreference",
    userPreferenceSchema
);