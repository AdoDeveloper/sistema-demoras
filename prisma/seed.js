const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Crear o actualizar los roles:
  await prisma.role.upsert({
    where: { name: "Administrador" },
    update: {},
    create: { name: "Administrador" },
  });
  await prisma.role.upsert({
    where: { name: "Asistente Operativo" },
    update: {},
    create: { name: "Asistente Operativo" },
  });
  console.log("Roles creados correctamente ✅");

  // Array de usuarios con sus datos, asignando a Almapac el rol admin (id: 1)
  // y a los demás el rol user (id: 2).
  const users = [
    {
      id: 1,
      username: "Almapac",
      email: "almapac@sistemademoras.com",
      password: "Almapac2025",
      nombreCompleto: "Almapac",
      codigo: "ALMAPAC",
      roleId: 1,
    },
    {
      id: 2,
      username: "Adolfo",
      email: "adolfo@sistemademoras.com",
      password: "Almapac2025",
      nombreCompleto: "Adolfo Cortez",
      codigo: "2264",
      roleId: 2,
    },
    {
      id: 3,
      username: "Gabriela",
      email: "gabriela@sistemademoras.com",
      password: "Almapac2025",
      nombreCompleto: "Gabriela Pimentel",
      codigo: "2266",
      roleId: 2,
    },
    {
      id: 4,
      username: "Marcela",
      email: "marcela@sistemademoras.com",
      password: "Almapac2025",
      nombreCompleto: "Marcela Cuevas",
      codigo: "2265",
      roleId: 2,
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
  
    await prisma.user.upsert({
      where: { id: user.id },  // Usa el id único en lugar de email
      update: {},
      create: {
        username: user.username,
        nombreCompleto: user.nombreCompleto,
        codigo: user.codigo,
        email: user.email,
        password: hashedPassword,
        eliminado: false,
        activo: true,
        roleId: user.roleId,
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
