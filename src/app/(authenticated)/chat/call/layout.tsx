"use client";

import { UserProvider } from "@/providers/user-provider";

export default function CallLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="h-screen w-screen bg-black">
        {children}
      </div>
    </UserProvider>
  );
}
