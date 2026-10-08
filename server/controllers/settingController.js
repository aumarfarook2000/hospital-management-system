import Setting from "../models/Setting.js";

const getSettings = async (req, res) => {
    try {
        let settings =
            await Setting.findOne();

        if (!settings) {
            settings =
                await Setting.create({});
        }

        return res.status(200).json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error(
            "Get Settings Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load system settings.",
        });
    }
};

const updateSettings = async (
    req,
    res
) => {
    try {
        const allowedFields = [
            "hospitalName",
            "hospitalEmail",
            "hospitalPhone",
            "hospitalAddress",
            "appointmentDuration",
            "workingFrom",
            "workingTo",
            "currency",
            "taxPercentage",
            "invoicePrefix",
            "lowStockLevel",
            "expiryWarningDays",
            "timezone",
            "dateFormat",
            "emailResetSubject",
            "emailResetHeading",
            "emailResetMessage",
            "emailResetButtonText",
            "emailResetButtonColor",
            "emailResetFooter",
        ];

        const updateData = {};

        allowedFields.forEach(
            (field) => {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    updateData[field] =
                        req.body[field];
                }
            }
        );

        updateData.updatedBy =
            req.user._id;

        let settings =
            await Setting.findOne();

        if (!settings) {
            settings =
                await Setting.create(
                    updateData
                );
        } else {
            Object.assign(
                settings,
                updateData
            );

            await settings.save();
        }

        return res.status(200).json({
            success: true,
            message:
                "Hospital settings updated successfully.",
            settings,
        });
    } catch (error) {
        console.error(
            "Update Settings Error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update hospital settings.",
        });
    }
};

export {
    getSettings,
    updateSettings,
};