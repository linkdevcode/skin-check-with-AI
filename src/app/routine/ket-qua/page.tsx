import type { Metadata } from "next";
import { RoutineKetQuaContent } from "./ket-qua-content";

export const metadata: Metadata = {
  title: "Kết quả phân tích",
  description: "Điểm số routine, xung đột hoạt chất và lời khuyên từ AI.",
};

export default function RoutineKetQuaPage() {
  return <RoutineKetQuaContent />;
}
