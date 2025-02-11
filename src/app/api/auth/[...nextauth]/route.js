import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import NodeCache from "node-cache"; // 📌 Importamos caché en servidor

const prisma = new PrismaClient();
const sessionCache = new NodeCache({ stdTTL: 3600 }); // 📌 Caché de sesión (1 hora)

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
        if (!credentials.username || !credentials.password) {
          throw new Error("Faltan credenciales");
        }

        // 📌 Verificar si el usuario está en caché
        let user = sessionCache.get(`user-${credentials.username}`);

        if (!user) {
          user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Credenciales incorrectas");
          }

          // 📌 Almacenar en caché los datos del usuario
          sessionCache.set(`user-${credentials.username}`, user);
        }

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
        session.user = {
          id: token.id,
          username: token.username,
        };

        // 📌 Guardar sesión en caché
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
export { handler as GET, handler as POST };
