# Combined mod downloads

`npm start` and `npm run build` cache the release assets pinned in
`src/assets/mod-downloads.json`. The initial run downloads about 133 MiB;
subsequent runs verify and reuse the ignored `src/assets/mod-downloads/` cache.
Production hosting serves these files with the app so browser downloads work
without relying on GitHub release-asset CORS support. ZIP assembly runs on the
client using `fflate`; no upload or ZIP-building backend is used.

The page renders the saved catalog immediately, then checks GitHub's marked
latest releases once per app session. Failed checks retain the saved entries.
Release labels and links update live; a new release remains unavailable for the
combined ZIP until its exact package is cached in a new site build. Selections
for those uncached releases are cleared, so older packages are never offered
under a newer release label. New versions do not inherit SC compatibility
unless the release explicitly declares it.

When updating an installable release, update its catalog entry and download
manifest together. Pin the release URL, exact asset name/URL, and SHA-256 of the
downloaded asset. Review archive paths: `stripPrefix` removes an outer `mods/`
folder only when the upstream package contains one. Keep JAR assets intact.
The cache script fails if a pinned asset changes rather than serving unchecked
bytes. Download URLs include the checksum so new releases bypass long-lived
browser/CDN caches. The generated combined ZIP is extracted directly into `SC/mods`.

# Credits

### [Severed Chains](https://github.com/Legend-of-Dragoon-Modding/Severed-Chains)

- Reverse engineering the game’s file formats and behavior, providing the foundation for our asset and world map tools

### [Monoxide](https://github.com/LordMonoxide)

- Creating Severed Chains

### [Zychronix](https://github.com/Zychronix)

- Compiling and maintaining the various LoD stats in use by the community

# LLM Disclaimer

LLMs were used to assist in creating portions of this app, while some parts had no LLM assistance.

AI is a tool whose usefulness depends on the expertise, experience, and skill of the person using it.

It does not replace engineering judgment or reduce the need for engineering quality and standards
<b><p align="center">Quality and engineering standards are solely on contributors</p></b>
