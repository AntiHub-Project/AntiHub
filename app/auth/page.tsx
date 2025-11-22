import { Suspense } from "react";
import { AuthPage } from "@/components/ui/auth-page";

export default function DemoOne() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthPage />
    </Suspense>
  );
}