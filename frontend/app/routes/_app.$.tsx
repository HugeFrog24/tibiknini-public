import { useLocation } from 'react-router';

export default function CatchAll() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to components
  switch (path) {
    default:
      throw new Response("Not Found", {
        status: 404,
        statusText: "Not Found"
      });
  }
}
