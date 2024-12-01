import type { NavigateFunction } from "@remix-run/react";

export const handleLogout = async (
  navigate: NavigateFunction,
  updateUser: (user: null) => void
) => {
  try {
    const response = await fetch("/api/auth/logout/", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      updateUser(null);
      navigate("/login");
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
