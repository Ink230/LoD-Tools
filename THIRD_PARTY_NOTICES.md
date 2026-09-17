# Third-party notices

## Severed Chains

- Project: https://github.com/Legend-of-Dragoon-Modding/Severed-Chains
- Credits: LordMonoxide and the Severed Chains contributors
- License: GNU Affero General Public License, version 3; the license text is included in [LICENSE.txt](LICENSE.txt)
- Support LordMonoxide: https://ko-fi.com/monoxide

Reverse-engineering credit belongs to Severed Chains, LordMonoxide, and contributors.
Ink is an SC contributor.

Parts of the Asset Viewer and World Map Editor use information, data, and behavior
from Severed Chains. The browser implementation includes TypeScript adaptations
and reimplementations of selected file decoders, texture and palette mapping,
animation transforms, scene composition, and effect-script preview behavior.
The bundled vanilla world-map preset is exported through SC's world-map API.
These tools do not run the complete Severed Chains Java engine in the browser.

Attribution does not replace the requirements of the applicable license. When
distributing covered code, preserve applicable notices and provide corresponding
source under the license's terms. Make the corresponding source for deployed
versions available as required by the license.

## Original game assets

The Legend of Dragoon game content remains the property of its respective rights
holders. Character portraits and world-map terrain guide images in `src/assets`
are game imagery or images derived from game resources. They are not relicensed
under the software license, and neither this notice nor SC's license grants
permission to redistribute them.

The Asset Viewer normally reads selected game resources from the user's local SC
extraction. The bundled asset catalog describes those resources; it does not
replace the user's extracted files.

## Dependencies

Third-party dependencies retain their own licenses and notices. See the packages
listed in `package.json` and the exact versions in `package-lock.json`. Preserve
the dependency license notices emitted with production distributions.
