import * as React from "react";
import { ClientOnly } from "remix-utils/client-only";
import ForgotPassword from "../old-app/components/ForgotPassword";

export default function ForgotPasswordPage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => <ForgotPassword />}
    </ClientOnly>
  );
} 