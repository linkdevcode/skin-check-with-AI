import type { Metadata } from "next";
import { RoutineInputForm } from "@/app/components/routine-input-form";

export const metadata: Metadata = {
  title: "Nhập routine",
  description: "Dán routine sáng/tối, rà soát và phân tích với SkinCheck AI.",
};

export default function RoutinePage() {
  return <RoutineInputForm />;
}
