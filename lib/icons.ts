import {
  BookOpenCheck,
  Code2,
  Headphones,
  Languages,
  Layers,
  LayoutTemplate,
  Palette,
  RefreshCw,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * The icons a service or a feature card can carry. The content files name one of these keys;
 * the control panel offers them by their Arabic names.
 */
export const ICONS: Record<string, { icon: LucideIcon; ar: string }> = {
  theme: { icon: LayoutTemplate, ar: 'ثيم / قالب' },
  custom: { icon: Palette, ar: 'تصميم خاص' },
  launch: { icon: Rocket, ar: 'انطلاق' },
  store: { icon: Store, ar: 'متجر' },
  guide: { icon: BookOpenCheck, ar: 'شرح' },
  support: { icon: Headphones, ar: 'دعم' },
  mobile: { icon: Smartphone, ar: 'جوال' },
  languages: { icon: Languages, ar: 'لغات' },
  fast: { icon: Zap, ar: 'سرعة' },
  updates: { icon: RefreshCw, ar: 'تحديثات' },
  code: { icon: Code2, ar: 'برمجة' },
  shield: { icon: ShieldCheck, ar: 'ضمان' },
  cart: { icon: ShoppingBag, ar: 'تسوّق' },
  layers: { icon: Layers, ar: 'أقسام' },
  tools: { icon: Wrench, ar: 'تجهيز' },
  star: { icon: Sparkles, ar: 'تميّز' },
};

/** The icon of that name, or a neutral one when the name is unknown. */
export const iconOf = (name: string | undefined): LucideIcon => (name && ICONS[name]?.icon) || Sparkles;
