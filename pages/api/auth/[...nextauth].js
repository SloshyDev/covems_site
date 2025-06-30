import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const user = {
          id: 1,
          name: process.env.ADMIN_USER,
          username: process.env.ADMIN_USER,
        };
        const isValid =
          credentials.username === process.env.ADMIN_USER &&
          credentials.password === process.env.ADMIN_PASS;
        if (isValid) {
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
});
