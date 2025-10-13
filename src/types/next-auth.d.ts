import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      companyName?: string;
      verified?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    companyName?: string;
    verified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string;
    email?: string;
    companyName?: string;
    verified?: boolean;
  }
}

