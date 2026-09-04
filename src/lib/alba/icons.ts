import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  Focus,
  Footprints,
  Heart,
  Laptop,
  Leaf,
  Moon,
  Music,
  PenLine,
  ShowerHead,
  StretchHorizontal,
  Sun,
  Timer,
  Utensils,
  Wind,
} from "lucide-react";
import type { HabitIconId } from "./types";

export const HABIT_ICONS: Record<HabitIconId, LucideIcon> = {
  brain: Brain,
  dumbbell: Dumbbell,
  book: BookOpen,
  focus: Focus,
  walk: Footprints,
  pen: PenLine,
  droplets: Droplets,
  coffee: Coffee,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  music: Music,
  utensils: Utensils,
  laptop: Laptop,
  shower: ShowerHead,
  stretch: StretchHorizontal,
  bike: Bike,
  wind: Wind,
  leaf: Leaf,
  timer: Timer,
};

export const HABIT_ICON_IDS = Object.keys(HABIT_ICONS) as HabitIconId[];
