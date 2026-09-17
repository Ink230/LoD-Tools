# Game Data catalogs

Run from the website repository:

```powershell
python tools/game-data/generate.py D:/java/sc
python tools/game-data/verify.py
node tools/game-data/verify-character-stats.mjs D:/java/sc
```

The generator reads SC's Java registries, character spell unlocks, English
localization, enemy stats/rewards, submap encounter records, and stage ambiance.
Stage resource sizes come from the local extraction. It writes JSON catalogs
under `src/assets/game-data` and the small character spell table used by the
existing character service. It does not copy game binary payloads.

`provenance.json` records the SC commit and SHA-256 of each source file read.
These hashes also identify local source changes not represented by the commit.
Regenerate and commit all generated outputs together when updating the snapshot.

The existing character level and addition tables remain in `GameDataService`.
HP, speed, attack, defense, magic attack, and magic defense were checked against
cumulative increments in SC's character templates for all nine characters,
levels 1–60. The five Dragoon-level modifier rows were checked as well (3,420 values).
Level zero remains the original sentinel row. Addition catalogs expose those
existing hit records with their level multipliers.

The enemy name array has 512 slots but SC has 400 stat/reward rows. The catalog
contains all 400 stat/reward rows, including unnamed/unused slots. It does not
invent stats for the remaining name slots. Internal spell IDs and repeated
encounter formations are retained. Submap area IDs and cut IDs are distinct;
their names are not guessed or joined by coincidentally matching numbers.

Spell power uses SC's encoded magic-damage multiplier and the in-game 25% STR
baseline. Healing percentages and special effects are separate. Divine spells
unlock with the Divine spirit, not a normal D-Level criterion.
