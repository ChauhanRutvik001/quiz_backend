import User from "../models/userModel.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

export const isAuthorized = async (req, res, next) => {
    try{
        console.log(req.headers.cookie)
        if (!req.headers.cookie) {
            console.log("Unauthorized error: TOKEN NOT FOUND");
        };
        const token = req.headers.cookie.slice(6);
        const decoded = await verifyToken(token);
        const user = await User.findById(decoded.id, { password: 0 });
        if (!user){
            console.log("Unauthorized error: USER NOT FOUND");
        };
        req.user = {
            id: user._id,
        };
        next();
    }
    catch (error) {
        console.log("Unauthorized error: ");
    }
};

export default isAuthorized;