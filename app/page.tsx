import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  HardHat,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UsersRound
} from "lucide-react";

const roleCards = [
  {
    title: "Yonetici",
    description: "Tum santiyeleri, kullanicilari, metrajlari ve raporlari yonetir.",
    items: ["Kullanici yetkileri", "Genel raporlar", "Tum kayitlar"]
  },
  {
    title: "Saha Kullanici",
    description: "Kendi sorumlu oldugu santiye kayitlarini girer ve takip eder.",
    items: ["Gunluk imalat", "Metraj girisi", "Fotograf/not"]
  }
];

const stats = [
  { label: "Aktif santiye", value: "2", icon: Building2 },
  { label: "Bekleyen is", value: "14", icon: ClipboardCheck },
  { label: "Bu ay metraj", value: "1.280 m", icon: FileSpreadsheet }
];

const workItems = [
  { site: "Merkez Santiye", task: "Kaba insaat metraj kontrolu", status: "Devam ediyor" },
  { site: "Blok A", task: "Elektrik tesisat imalat girisi", status: "Bugun" },
  { site: "Depo Alani", task: "Hak edis notlari ve fotograf ekleri", status: "Bekliyor" }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between px-5 py-6 sm:px-8 lg:px-12">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded bg-[#1f4d3a] text-white">
                <HardHat size={23} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#1f4d3a]">
                  YS Muhendislik
                </p>
                <p className="text-xs text-[#61706b]">Santiye Takip</p>
              </div>
            </div>
            <button className="inline-flex size-10 items-center justify-center rounded border border-[#c8c0b3] bg-white text-[#1d2522] shadow-sm">
              <LockKeyhole size={18} />
            </button>
          </nav>

          <div className="max-w-3xl py-10 lg:py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm text-[#52605b]">
              <ShieldCheck size={16} className="text-[#1f4d3a]" />
              Iki kullanicili, rol bazli takip sistemine hazir
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-[#16201d] sm:text-5xl lg:text-6xl">
              YS Muhendislik Santiye Takip
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52605b]">
              Santiye isleri, metraj girisleri, gunluk ilerleme ve yetkili kullanici akislari
              icin hizli baslangic paneli.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                href="#giris"
              >
                Kuruluma basla
                <ArrowUpRight size={17} />
              </a>
              <a
                className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-5 py-3 text-sm font-semibold text-[#1d2522]"
                href="#yetkiler"
              >
                Yetkileri gor
                <UsersRound size={17} />
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded border border-[#d7d0c4] bg-white p-4">
                  <Icon size={19} className="text-[#b56b34]" />
                  <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-[#61706b]">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#20342d] p-5 text-white sm:p-8 lg:p-10">
          <div id="giris" className="mx-auto flex h-full max-w-xl flex-col justify-center">
            <div className="rounded border border-white/12 bg-white p-5 text-[#1d2522] shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f4d3a]">Demo panel</p>
                  <h2 className="mt-1 text-2xl font-semibold">Hizli giris hazirligi</h2>
                </div>
                <Gauge className="text-[#b56b34]" size={28} />
              </div>

              <div className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  E-posta
                  <input
                    className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
                    placeholder="admin@ysmuhendislik.com"
                    type="email"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Sifre
                  <input
                    className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
                    placeholder="Supabase baglaninca aktif olacak"
                    type="password"
                  />
                </label>
                <button className="mt-2 inline-flex items-center justify-center gap-2 rounded bg-[#1f4d3a] px-4 py-3 text-sm font-semibold text-white">
                  <LockKeyhole size={17} />
                  Giris yap
                </button>
              </div>

              <div className="mt-6 rounded bg-[#f4f1ea] p-4">
                <p className="text-sm font-semibold">Bugunku isler</p>
                <div className="mt-3 grid gap-3">
                  {workItems.map((item) => (
                    <div key={item.task} className="flex items-start justify-between gap-3 border-t border-[#d7d0c4] pt-3 first:border-t-0 first:pt-0">
                      <div>
                        <p className="text-sm font-semibold">{item.task}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#61706b]">
                          <MapPin size={13} />
                          {item.site}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-white px-2 py-1 text-xs text-[#1f4d3a]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="yetkiler" className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center gap-2 text-[#52605b]">
            <CalendarDays size={18} />
            <p className="text-sm font-medium">Ilk kurulum plani</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {roleCards.map((role) => (
              <article key={role.title} className="rounded border border-[#d7d0c4] bg-white p-5">
                <h3 className="text-xl font-semibold">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#61706b]">{role.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {role.items.map((item) => (
                    <span key={item} className="rounded bg-[#eef0ec] px-3 py-2 text-sm text-[#33413c]">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
