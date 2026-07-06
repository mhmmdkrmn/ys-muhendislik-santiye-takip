import { LoginPanel } from "@/components/LoginPanel";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-4 py-8 text-[#1d2522]">
      <section className="w-full max-w-sm rounded border border-[#d7d0c4] bg-white p-6 shadow-sm">
        <LoginPanel />
      </section>
    </main>
  );
}
