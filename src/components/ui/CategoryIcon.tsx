import React from "react";
import {
  Hammer,
  HeartPulse,
  Layers,
  Sparkles,
  Trees,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import type { ServiceCategory } from "@/types/domain";

interface CategoryIconProps {
  name: ServiceCategory["iconName"];
  className?: string;
}

export function CategoryIcon({ name, className = "h-5 w-5" }: CategoryIconProps) {
  switch (name) {
    case "Hammer":
      return <Hammer className={className} aria-hidden="true" />;
    case "Wrench":
      return <Wrench className={className} aria-hidden="true" />;
    case "Zap":
      return <Zap className={className} aria-hidden="true" />;
    case "Sparkles":
      return <Sparkles className={className} aria-hidden="true" />;
    case "Trees":
      return <Trees className={className} aria-hidden="true" />;
    case "Truck":
      return <Truck className={className} aria-hidden="true" />;
    case "HeartPulse":
      return <HeartPulse className={className} aria-hidden="true" />;
    case "Layers":
    default:
      return <Layers className={className} aria-hidden="true" />;
  }
}
