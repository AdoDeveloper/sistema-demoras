// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        console.log(`🔑 [authorize] Intento login: ${credentials?.username}`);
        if (!credentials?.username || !credentials?.password) {
          console.log(`❌ [authorize] Faltan credenciales`);
          throw new Error("Faltan credenciales");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true },
        });

        if (!user || user.eliminado) {
          console.log(`❌ [authorize] Usuario no existe o eliminado`);
          throw new Error("Credenciales incorrectas");
        }
        if (!user.activo) {
          console.log(`🚫 [authorize] Usuario inactivo`);
          throw new Error("Usuario inactivo. Comuníquese con el administrador");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          console.log(`❌ [authorize] Contraseña inválida`);
          throw new Error("Credenciales incorrectas");
        }

        console.log(`✅ [authorize] Login OK: ${user.username}`);
        return {
          id:             user.id,
          username:       user.username,
          roleId:         user.roleId,
          roleName:       user.role.name,
          codigo:         user.codigo,
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
        token.id             = user.id;
        token.username       = user.username;
        token.roleId         = user.roleId;
        token.roleName       = user.roleName;
        token.codigo         = user.codigo;
        token.nombreCompleto = user.nombreCompleto;
        console.log(`✅ [JWT] Token inicial para ${user.username}`);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id:             token.id,
        username:       token.username,
        roleId:         token.roleId,
        roleName:       token.roleName,
        codigo:         token.codigo,
        nombreCompleto: token.nombreCompleto,
      };
      console.log(
        `🕒 [session] Enviando session para ${token.username}; expires in ${session.expires}`
      );
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      console.log(
        `🎉 [event signIn] id=${user.id}, username=${user.username}, isNewUser=${isNewUser}`
      );
    },
    async signOut({ token }) {
      console.log(
        `🔒 [event signOut] id=${token?.id}, username=${token?.username}`
      );
    },
    async error({ error, method }) {
      console.log(`⚠️ [event error] método=${method}`, error);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};