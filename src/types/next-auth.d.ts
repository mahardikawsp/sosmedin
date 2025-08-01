import NextAuth from "next-auth";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's id. */
            id: string;
            /** The user's name. */
            name?: string | null;
            /** The user's email address. */
            email?: string | null;
            /** The user's image. */
            image?: string | null;
            /** The user's username. */
            username: string;
        };
    }

    interface User {
        /** The user's username. */
        username: string;
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        /** The user's id. */
        userId: string;
        /** The user's username. */
        username: string;
    }
}