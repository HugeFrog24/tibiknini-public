import * as React from 'react';
import { useLocation } from "@remix-run/react";
import OnlineUsersPage from "../old-app/components/OnlineUsersPage";

export default function CatchAll() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to components
  let component;
  switch (path) {
    case '/online-users':
      component = <OnlineUsersPage />;
      break;
    default:
      throw new Response("Not Found", {
        status: 404,
        statusText: "Not Found"
      });
  }

  return component;
}
