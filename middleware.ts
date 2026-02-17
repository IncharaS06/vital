import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "kn", "hi"] as const;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ✅ Allow Next internals
    if (pathname.startsWith("/_next")) return NextResponse.next();

    // ✅ Allow API routes
    if (pathname.startsWith("/api")) return NextResponse.next();

    // ✅ Allow ALL public files (manifest, images, icons, css, js, etc.)
    // This prevents /manifest.json -> /en/manifest.json redirect
    const isFileRequest = pathname.includes(".");
    if (isFileRequest) return NextResponse.next();

    // If path already has locale like /en/..., do nothing
    const first = pathname.split("/")[1];
    if (LOCALES.includes(first as any)) return NextResponse.next();

    // Redirect non-locale paths to /en
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
}

export const config = {
    // ✅ Run middleware only for app pages, not for files
    matcher: ["/((?!_next|api|.*\\..*).*)"],
};
