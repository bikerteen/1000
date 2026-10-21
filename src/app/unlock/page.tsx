import type { Metadata } from "next";
import UnlockScreen from "@/components/UnlockScreen";

export const metadata: Metadata = {
  title: "Private — 1000 Rejections",
  robots: { index: false, follow: false },
};

export default function UnlockPage() {
  return <UnlockScreen />;
}
