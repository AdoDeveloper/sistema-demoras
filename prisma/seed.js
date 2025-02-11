const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: "Adolfo", email: "adolfo@sistemademoras.com", password: "Almapac2024" },
    { username: "Marcela", email: "marcela@sistemademoras.com", password: "Almapac2024" },
    { username: "Gabriela", email: "gabriela@sistemademoras.com", password: "Almapac2024" },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
      },
    });
  }

  console.log("Usuarios creados correctamente ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
