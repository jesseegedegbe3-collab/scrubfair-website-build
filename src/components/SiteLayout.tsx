import { Outlet } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function SiteLayout() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
      <SiteHeader />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
