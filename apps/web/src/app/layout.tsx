import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// 正文字体：Space Grotesk - 更具个性的现代字体
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// 代码字体：IBM Plex Mono - 清晰的工程感等宽字体
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AgentFlow - AI 工作流平台",
  description: "本地优先、代码级自定义、社区驱动的 AI Agent 工作流平台",
  keywords: ["AI", "Agent", "Workflow", "自动化", "工作流"],
  authors: [{ name: "AgentFlow Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body 
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
