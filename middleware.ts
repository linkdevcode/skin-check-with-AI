import { auth } from "@/auth";

export default auth((req) => {
  const isHistory = req.nextUrl.pathname.startsWith("/lich-su");
  if (isHistory && !req.auth) {
    const signIn = new URL("/dang-nhap", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signIn);
  }
});

export const config = {
  matcher: ["/lich-su", "/lich-su/:path*"],
};
