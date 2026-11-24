# Theme documentation files — the shape every `content/themes/<slug>.json` must have

The site (GT-THEMES, the support site of a theme developer) shows, for each theme, a page of
documentation: for every section of the theme, one picture, what the section is for, and how
to set it up. Merchants read it; most of them are not technical. Arabic is the main
language. English is optional: give it where the source has it, otherwise leave the `en`
key out (the site falls back to Arabic).

```jsonc
{
  "slug": "marc",                      // file name without .json; lowercase latin
  "platform": "salla",                 // "salla" | "zid"
  "name": { "ar": "مارك", "en": "Marc" },
  "tagline": { "ar": "ثيم أزياء بثلاث إطلالات", "en": "A fashion theme with three looks" },
  "summary": { "ar": "فقرة من ٢–٣ جمل: لمن الثيم وما الذي يميّزه.", "en": "…" },
  "cover": "/docs/marc/cover.webp",    // a wide picture of the theme's home page
  "demos": [                           // live demo stores, if any (leave [] when unknown)
    { "label": { "ar": "ماركو — أزياء نسائية", "en": "Marco — women's fashion" }, "url": "https://…" }
  ],
  "highlights": [                      // 6–10 short selling points
    { "ar": "ثلاث إطلالات جاهزة تُبدَّل بإعداد واحد", "en": "Three looks, one setting" }
  ],
  "groups": [                          // the documentation, in reading order
    {
      "id": "start",                   // lowercase latin, unique in the file
      "title": { "ar": "البداية", "en": "Getting started" },
      // "kind": "faq",                // only on the group of common questions: its sections are
                                       // shown as questions that unfold, and need no picture
      "sections": [
        {
          "id": "hero",                // lowercase latin with dashes, unique in the file
          "title": { "ar": "الهيرو الرئيسي", "en": "Hero" },
          "image": "/docs/marc/hero.webp",          // desktop picture of this section ("" if none)
          "image_mobile": "/docs/marc/hero-m.webp", // optional phone picture
          "markers": [                               // optional: numbered arrows over the desktop picture
            { "x": 72, "y": 40, "text": { "ar": "زر الشريحة", "en": "The slide's button" } }  // x, y = percent of the picture
          ],
          "text": { "ar": "ما هذا القسم ولماذا يُستخدم — ٢ إلى ٤ جمل واضحة.", "en": "…" },
          "steps": { "ar": ["افتح محرر الثيم ثم …", "اختر …", "احفظ"], "en": ["…"] },
          "settings": [                // the options that matter, in the order of the panel
            { "label": "شكل الهيرو", "note": { "ar": "سينمائي: شريط صور متحرك · أكورديون · سلايدشو", "en": "…" } }
          ],
          "tip": { "ar": "نصيحة عملية واحدة (اختياري).", "en": "…" }
        }
      ]
    }
  ]
}
```

## Rules
- **Truthful.** Every section, option label and behaviour must exist in the theme's own files
  (its schema / settings files). Quote option labels exactly as the merchant sees them in the
  editor. If you are not sure something exists, leave it out. No prices, no "best / fastest".
- **Arabic** as a native speaker writes for Gulf merchants: clear Modern Standard Arabic,
  second person, short sentences. No English words where an Arabic one exists (keep product
  names like YouTube).
- **Pictures** live in `public/docs/<slug>/` and are referenced as `/docs/<slug>/<file>`.
  Format **WebP**, desktop pictures at most **1400 px wide**, phone pictures at most
  **480 px wide**, quality about 80, each file under ~250 KB. Name them after the section id
  (`hero.webp`, `hero-m.webp`). Convert with Python + Pillow
  (`Image.open(src).convert('RGB')` → `thumbnail` → `save(dst, 'WEBP', quality=80, method=6)`).
  Never reference a picture that is not in the folder, and never hot-link a picture from
  another site.
- `steps` are things the merchant DOES, in order ("من لوحة التحكم ← تصميم المتجر ← …").
  `settings` describe what each option DOES. Keep both short: 3–6 steps, 3–10 settings.
- Valid JSON (no comments, no trailing commas), UTF-8, Arabic written directly.
