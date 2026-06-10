import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";

const main = async () => {
  const email = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD ?? "");
  const name = String(process.env.ADMIN_NAME ?? "Admin").trim() || "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to create the admin user");
  }

  if (password.length < 12 || password.includes("CHANGE_ME")) {
    throw new Error("ADMIN_PASSWORD must be replaced and contain at least 12 characters");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log("Production admin already exists");
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  console.log("Production admin created successfully");
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to create production admin");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
