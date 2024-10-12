import jwt from "jsonwebtoken";

export const createToken = async (payload) => {
  const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXP,
  });

  return token;
};

export const verifyToken = async (token) => {
  try{
    return await jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      console.log("Hello from verify");
      return decoded;
    });
  }
  catch (error){
    console.error("Error in verifyToken:");
  }
};
