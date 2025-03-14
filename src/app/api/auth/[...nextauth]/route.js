import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import NodeCache from "node-cache";

const prisma = new PrismaClient();
const sessionCache = new NodeCache({ stdTTL: 3600 });

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Ingrese su username" },
        password: { label: "Password", type: "password", placeholder: "Ingrese su contraseña" },
      },
      async authorize(credentials) {
        // Validar que se hayan proporcionado username y password
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        // Intentar obtener el usuario desde la cache
        let user = sessionCache.get(`user-${credentials.username}`);
        if (!user) {
          // Buscar el usuario en la base de datos
          user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: { role: true },
          });
          if (!user) {
            throw new Error("Usuario no encontrado");
          }
          // Comparar la contraseña proporcionada con la almacenada (hasheada)
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Credenciales incorrectas");
          }
          // Almacenar en caché los datos del usuario
          sessionCache.set(`user-${credentials.username}`, user);
        }

        // Retornar la información del usuario, incluyendo nombreCompleto si roleId es 3
        return {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          roleName: user.role.name,
          ...(user.roleId === 3 && { nombreCompleto: user.nombreCompleto }),
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          roleId: token.roleId,
          roleName: token.roleName,
          ...(token.roleId === 3 && { nombreCompleto: token.nombreCompleto }),
        };
        // Opcional: guardar la sesión en cache
        sessionCache.set(`session-${token.id}`, session);
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        if (user.roleId === 3 && user.nombreCompleto) {
          token.nombreCompleto = user.nombreCompleto;
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const GET = handler;
export const POST = handler;
