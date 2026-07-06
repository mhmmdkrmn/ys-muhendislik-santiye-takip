import { HardHat } from "lucide-react";
import { LoginPanel } from "@/components/LoginPanel";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-4 py-8 text-[#1d2522]">
      <section className="w-full max-w-md rounded border border-[#d7d0c4] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded bg-[#1f4d3a] text-white">
            <HardHat size={23} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-lg font-semibold">YS Muhendislik</h1>
            <p className="text-sm text-[#61706b]">Santiye Takip</p>
          </div>
        </div>

        <LoginPanel />
      </section>
    </main>
  );
}
