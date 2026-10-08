import jwt from "jsonwebtoken";

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            profileId: user.profileId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};

export default generateToken;