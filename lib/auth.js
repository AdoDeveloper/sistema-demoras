// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Instancia global de Prisma
const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error", "warn"] });
globalForPrisma.prisma = prisma;

// Configuración del rate limiter: 5 intentos cada 15 minutos
const rateLimiter = new RateLimiterMemory({
  points: 5,             // número de intentos
  duration: 30,     // ventana en segundos
});

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        // Intento de consumir un punto; si excede, lanza RateLimiterRes error
        try {
          await rateLimiter.consume(ip);
        } catch {
          // Si ya superó el límite:
          throw new Error("Demasiados intentos. Intenta de nuevo más tarde.");
        }

        console.log(`🔑 [authorize] Intento login: ${credentials?.username}`);

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Usuario o contraseña inválidos");
        }

        const username = credentials.username.trim().toLowerCase();
        const password = credentials.password;

        const user = await prisma.user.findUnique({
          where: { username },
          include: { role: true },
        });

        // Preparar hash fake para igualar tiempos aunque no exista usuario
        const hash = user
          ? user.password
          : "$2a$10$C6UzMDM.H6dfI/f/IKcEeO";

        const valid = await bcrypt.compare(password, hash);
        if (!user || user.eliminado || !user.activo || !valid) {
          console.log(`❌ [authorize] Credenciales inválidas para ${username}`);
          throw new Error("Usuario o contraseña inválidos");
        }

        console.log(`✅ [authorize] Login OK: ${username}`);

        // En caso de éxito, resetear contador de la IP
        await rateLimiter.delete(ip);

        return {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          roleName: user.role.name,
          codigo: user.codigo,
          nombreCompleto: user.nombreCompleto,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },

  jwt: {
    maxAge: 12 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.codigo = user.codigo;
        token.nombreCompleto = user.nombreCompleto;
        console.log(`✅ [JWT] Token para ${user.username}`);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        roleId: token.roleId,
        roleName: token.roleName,
        codigo: token.codigo,
        nombreCompleto: token.nombreCompleto,
      };
      console.log(`🕒 [session] Sessión para ${token.username}`);
      return session;
    },
  },

  events: {
    async error({ error, method }) {
      console.warn(`[next-auth][${method}]`, error);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};