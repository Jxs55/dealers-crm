import { withAuth } from "next-auth/middleware"

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export default withAuth({
  secret: authSecret,
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
}
