---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/screens/HomeScreen.tsx"]
---

# Surface brief: MyOrbit app shell + all screens

Mode: Operate. Redesign of the whole mobile-first PWA (13 screens), replacing the generic white-card SaaS look. Audience: university student, phone, one hand, between classes; Spanish only; light + dark; WCAG AA; offline PWA. Preserve: function, copy, "órbita"/"radar" naming, navy+coral spirit.

## Direction contract
THESIS: The student's term is a transit network. Each subject/category is a coloured line, each deadline a station, "ahora" a marker moving along the line. Refuses the stack of same-size white rounded cards with coloured icon tiles and a gradient hero.
OWN-WORLD: Navy ground (#0E1626 dark / cool pale #EEF1F6 light), coral as the principal line, line colours blue/green/violet/amber/magenta as route colours; Barlow + Barlow Condensed (signage voice, route codes and times in condensed tabular numerals); flat panels split by hairlines, 4-6px radii, square route badges with a letter code, stations as dots on a 3px line. No shadows, no gradients, no icon tiles.
STORY: Open the app, read the Today line: what is now, which stations (deadlines) are next, which are late. Tap a station to open it; capture with the central add button. Habits run as a parallel line so academic and personal life are one network.
FIRST VIEWPORT: Home on 390px: compact top bar (date, greeting, theme), then the Day Line as the first and largest element: horizontal coral line with "ahora" marker and the next 3-4 stations (time or day, title, route badge), late stations in doubled/dashed form; below, the list of priority tasks as departure-board rows (route badge, title, due in condensed numerals, state mark); then the habits line; bottom nav with active-line indicator and central add.
FORM: Metro/route-line system (assigned candidate 3 of grounded list), seed key 2a45eb7e. Lends type, palette, density, one signature move (the line); navigation and controls stay standard.
State is carried by shape as well as colour: filled station = done, hollow = pending, dashed ring = overdue.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
