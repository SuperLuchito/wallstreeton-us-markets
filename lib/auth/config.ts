import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    }),
    EmailProvider({
      server: process.env.EMAIL_DEV_MODE === "true" 
        ? undefined 
        : {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          },
      from: process.env.EMAIL_FROM,
      ...(process.env.EMAIL_DEV_MODE === "true" && {
        sendVerificationRequest: async ({ identifier, url }) => {
          console.log("\n=== EMAIL MAGIC LINK (DEV MODE) ===");
          console.log(`To: ${identifier}`);
          console.log(`Link: ${url}`);
          console.log("===================================\n");
        },
      }),
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
