import { createCookieSessionStorage, redirect } from "@remix-run/node";

// This should match your backend's cookie settings
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "sessionid", // This should match Django's session cookie name
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "default-secret"], // Use an environment variable in production
    secure: process.env.NODE_ENV === "production",
    domain: process.env.NODE_ENV === "development" ? "localhost" : undefined,
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserSession(request: Request) {
  const session = await getSession(request);
  const user = session.get("user");
  return user;
}

export async function requireUser(request: Request) {
  const user = await getUserSession(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export async function createUserSession(user: any, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("user", user);
  
  // Instead of creating our own session, we'll use Django's session
  return redirect(redirectTo);
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
