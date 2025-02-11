import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import NodeCache from "node-cache"; // Usamos NodeCache para cachear datos en el servidor

// Instancia de Prisma
const prisma = new PrismaClient();

// Caché de sesión (1 hora de tiempo de vida)
const sessionCache = new NodeCache({ stdTTL: 3600 });

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verificamos que se hayan enviado las credenciales
        if (!credentials.username || !credentials.password) {
          throw new Error("Faltan credenciales");
        }

        // Intentamos obtener el usuario desde la caché
        let user = sessionCache.get(`user-${credentials.username}`);

        if (!user) {
          // Si no está en caché, buscar en la BD
          user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          // Comparamos la contraseña usando bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Credenciales incorrectas");
          }

          // Guardamos el usuario en caché
          sessionCache.set(`user-${credentials.username}`, user);
        }

        // Retornamos solo los datos necesarios para la sesión
        return { id: user.id, username: user.username };
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
        session.user = { id: token.id, username: token.username };

        // Guardamos la sesión en caché (opcional)
        sessionCache.set(`session-${token.id}`, session);
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Exportamos como funciones GET y POST para que Next.js 15 las reconozca correctamente
export { handler as GET, handler as POST };
