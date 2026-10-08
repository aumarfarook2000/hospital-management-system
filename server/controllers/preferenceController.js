import UserPreference from "../models/UserPreference.js";

// ============================================
// GET LOGGED-IN USER PREFERENCES
// ============================================

const getMyPreferences = async (req, res) => {
    try {
        let preferences =
            await UserPreference.findOne({
                user: req.user._id,
            });

        // Create default preferences automatically
        if (!preferences) {
            preferences =
                await UserPreference.create({
                    user: req.user._id,
                    theme: "light",
                    fontFamily: "inter",
                    fontSize: "normal",
                    sidebarMode: "expanded",
                });
        }

        return res.status(200).json({
            success: true,
            preferences,
        });
    } catch (error) {
        console.error(
            "Get Preferences Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load appearance preferences.",
        });
    }
};

// ============================================
// UPDATE LOGGED-IN USER PREFERENCES
// ============================================

const updateMyPreferences = async (
    req,
    res
) => {
    try {
        const {
            theme,
            fontFamily,
            fontSize,
            sidebarMode,
        } = req.body;

        const allowedThemes = [
            "light",
            "dark",
            "system",
        ];

        const allowedFonts = [
            "inter",
            "poppins",
            "roboto",
            "nunito",
            "system",
        ];

        const allowedFontSizes = [
            "small",
            "normal",
            "large",
        ];

        const allowedSidebarModes = [
            "expanded",
            "compact",
        ];

        if (
            theme &&
            !allowedThemes.includes(theme)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid theme.",
            });
        }

        if (
            fontFamily &&
            !allowedFonts.includes(fontFamily)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid font family.",
            });
        }

        if (
            fontSize &&
            !allowedFontSizes.includes(fontSize)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid font size.",
            });
        }

        if (
            sidebarMode &&
            !allowedSidebarModes.includes(
                sidebarMode
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid sidebar mode.",
            });
        }

        const updateData = {};

        if (theme !== undefined) {
            updateData.theme = theme;
        }

        if (fontFamily !== undefined) {
            updateData.fontFamily =
                fontFamily;
        }

        if (fontSize !== undefined) {
            updateData.fontSize =
                fontSize;
        }

        if (sidebarMode !== undefined) {
            updateData.sidebarMode =
                sidebarMode;
        }

        const preferences =
            await UserPreference.findOneAndUpdate(
                {
                    user: req.user._id,
                },
                {
                    $set: updateData,
                    $setOnInsert: {
                        user: req.user._id,
                    },
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Appearance settings updated successfully.",
            preferences,
        });
    } catch (error) {
        console.error(
            "Update Preferences Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update appearance settings.",
        });
    }
};

export {
    getMyPreferences,
    updateMyPreferences,
};