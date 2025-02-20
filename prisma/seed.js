const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const users = [
    { id: 1, username: "Almapac", email: "almapac@sistemademoras.com", password: "Almapac2025" },
    { id: 2264, username: "Adolfo Cortez", email: "adolfo@sistemademoras.com", password: "Almapac2025" },
    { id: 2265, username: "Marcela Cuevas", email: "marcela@sistemademoras.com", password: "Almapac2025" },
    { id: 2266, username: "Gabriela", email: "gabriela@sistemademoras.com", password: "Almapac2025" },
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
