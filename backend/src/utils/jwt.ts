import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
};

export const signJwt = (userId: string) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
};

export const verifyJwt = (token: string) => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string" || !("userId" in decoded)) {
    throw new Error("Invalid token payload");
  }

  return decoded as { userId: string };
};
