import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Configuración de NextAuth
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
        console.log(`🔑 [authorize] Intento de login con usuario: ${credentials?.username}`);

        if (!credentials?.username || !credentials?.password) {
          console.log(`❌ [authorize] Faltan credenciales: username o password no proporcionados`);
          throw new Error("Faltan credenciales");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: { role: true },
          });

          if (!user) {
            console.log(`❌ [authorize] Usuario no encontrado: ${credentials.username}`);
            throw new Error("Credenciales incorrectas");
          }

          if (user.eliminado) {
            console.log(`🚫 [authorize] Usuario eliminado: ${user.username}`);
            throw new Error("El usuario fue eliminado del sistema");
          }

          if (!user.activo) {
            console.log(`🚫 [authorize] Usuario inactivo: ${user.username}`);
            throw new Error("Usuario inactivo. Comuníquese con el administrador");
          }

          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) {
            console.log(`❌ [authorize] Contraseña incorrecta para usuario: ${user.username}`);
            throw new Error("Credenciales incorrectas");
          }

          console.log(`✅ [authorize] Login exitoso para: ${user.username}`);
          return {
            id:             user.id,
            username:       user.username,
            roleId:         user.roleId,
            roleName:       user.role.name,
            codigo:         user.codigo,
            nombreCompleto: user.nombreCompleto,
          };
        } catch (error) {
          console.error(`💥 [authorize] Error inesperado durante la autenticación:`, error);
          throw new Error("Error en el servidor de autenticación");
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 horas
  },

  jwt: {
    maxAge: 12 * 60 * 60, // igual que session.maxAge
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

        console.log(`✅ [JWT] Token generado para usuario: ${user.username} (Rol: ${user.roleName})`);
      } else {
        console.log(`🔄 [JWT] Reutilizando token existente para: ${token.username}`);
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
        `🕒 [session] Sesión generada para: ${token.username} (Rol: ${token.roleName}) | Expira: ${session.expires}`
      );

      return session;
    },
  },

  events: {
    async signIn({ user }) {
      console.log(
        `🎉 [event signIn] Login exitoso - ID: ${user.id}, Usuario: ${user.username}`
      );
    },

    async signOut({ token }) {
      console.log(
        `🔒 [event signOut] Cierre de sesión - ID: ${token?.id}, Usuario: ${token?.username}`
      );
    },

    async error({ error, method }) {
      console.error(`⚠️ [event error] Método: ${method} | Detalles:`, error);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Exportación correcta para App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };