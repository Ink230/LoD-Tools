import { Component } from '@angular/core';

let nextAttributionId = 0;

@Component({
  selector: 'app-sc-attribution',
  template: `
    <button type="button" aria-label="Severed Chains reverse-engineering credit" [attr.aria-describedby]="tooltipId">?</button>
    <div class="attribution" [id]="tooltipId" role="tooltip">
      <strong>Reverse-engineering credit belongs to Severed Chains, LordMonoxide, and contributors.</strong>
      <p class="contributor-credit">Ink is an SC contributor</p>
      <p>Our tools build on SC’s work in understanding the game’s files and behaviors. Selected decoding and preview behavior is reproduced in TypeScript from SC’s original implementation.</p>
      <table>
        <thead><tr><th>Layer</th><th>What we use or reproduce</th></tr></thead>
        <tbody>
          <tr><th>Extraction</th><td>SC extracts and prepares the files; the Asset Viewer reads that output</td></tr>
          <tr><th>Standard images</th><td>PNGs use normal browser image decoding</td></tr>
          <tr><th>Bespoke formats</th><td>TypeScript decoders interpret models, textures, animations and scene data using SC’s implementation as the reference</td></tr>
          <tr><th>Reconstruction</th><td>Texture and palette mapping, animation transforms, submap composition and effect previews reproduce selected SC behavior</td></tr>
          <tr><th>Editor interface</th><td>Navigation, pickers, controls and browser rendering are website code</td></tr>
        </tbody>
      </table>
      <p>The browser runs selected preview implementations, not the Java engine. Original game assets are separate from SC’s reverse-engineering and code contributions.</p>
    </div>
  `,
  styles: `
    :host { position: relative; display: inline-flex; vertical-align: middle; margin: 0 6px; letter-spacing: normal; }
    button { display: inline-grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 1px solid currentColor; border-radius: 4px; background: transparent; color: inherit; font: 700 12px/1 system-ui; cursor: help; }
    button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    .attribution { display: none; position: absolute; right: 0; top: 100%; z-index: 100; width: 540px; max-width: calc(100vw - 40px); box-sizing: border-box; padding: 16px; border: 1px solid #557449; border-radius: 5px; background: #111a10; color: #e1ecd9; box-shadow: 0 8px 24px #0008; font: 12px/1.5 system-ui; text-align: left; white-space: normal; }
    :host:hover .attribution, :host:focus-within .attribution { display: block; }
    strong { display: block; color: #b9dc9d; font-size: 13px; }
    .contributor-credit { color: #b9dc9d; }
    p { margin: 10px 0; }
    p:last-child { margin-bottom: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 7px 8px; border-bottom: 1px solid #354731; vertical-align: top; text-align: left; }
    th { color: #b9dc9d; }
    tbody th { width: 110px; }
  `,
})
export class ScAttributionComponent {
  readonly tooltipId = `sc-attribution-${nextAttributionId++}`;
}
