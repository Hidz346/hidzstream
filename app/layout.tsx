import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteChrome from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "HidzStreaming",
  description: "HidzStreaming — satu tempat untuk HIDZ ANIME, HIDZ COMIC, HIDZ DONGHUA, HIDZ DRACHIN, HIDZ MOVIES, HIDZ YOUTUBE, dan HIDZ TV.",
  applicationName: "HidzStreaming",
  icons: {
    icon: "https://www.gobox.my.id/file/vVUoB.png",
    apple: "https://www.gobox.my.id/file/vVUoB.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
