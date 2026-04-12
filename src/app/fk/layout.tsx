import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Führerscheinkontrolle",
  description: "Digitale Führerscheinkontrolle für Feuerwehren",
};

export default function FkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
