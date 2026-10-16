# Agent support audit and implementation

Checked against repository source and primary documentation on 2026-10-16. This is the gap list for DragoonMods, including capabilities we can use now and features that still need infrastructure or browser support. “Implemented” means included in these local changes, not deployed. Nothing was pushed.

## What each kind of agent can use

| Agent | Entry point | Data and actions |
| --- | --- | --- |
| HTTP fetch, crawler, agent without JavaScript | `/llms.txt`, `/agent/index.json` | Complete mod snapshot, Markdown guide, route map, six complete game tables and provenance |
| User's browser assistant or extension | Ordinary controls; WebMCP if supported | Current session releases, mod search, complete game-table queries, visible filters and validated selection |
| Headless or full browser automation | Accessible names, real links, stable mod IDs, query URLs | The ordinary UI, without requiring a vendor SDK or special agent user agent |
| Bring-your-own MCP client | Local `node tools/mcp-server.mjs` | Read-only catalog lookup, paginated table search and resources; no browser required |
| Remote MCP-only client | Not hosted yet | Needs an actual server runtime; static JSON is not an MCP transport |

## Full gap list

| Missing or incomplete before this work | Availability and benefit | Implementation or remaining boundary |
| --- | --- | --- |
| Non-JavaScript mod catalog | Ordinary static HTTP works across agent vendors | Implemented generated `/agent/mods.json` and `/agent/mods.md` from the same catalog as Angular |
| Explicit snapshot versus live release identity | Available today; prevents stale release claims | Implemented freshness notes; browser tools read the existing release service rather than a second catalog |
| Machine-readable ZIP eligibility | Available today; avoids requesting an uncached release | Implemented snapshot eligibility plus live browser checks; tools and unreleased mods remain excluded |
| Compact agent discovery | `llms.txt` is a proposal, not a browser guarantee or access policy | Implemented `/llms.txt` and HTML `describedby` discovery |
| JSON discovery and capabilities | Application-specific manifest, not a standard `.well-known` MCP endpoint | Implemented `/agent/index.json` with version, routes, datasets and transport boundaries |
| OpenAPI discovery for HTTP agents | Established API description format | Implemented `/agent/openapi.json` describing eleven existing GET resources; no invented write endpoints or server-side search parameters |
| Markdown alternate links | Standard HTML link relations; readers may choose to follow them | Implemented alternate/describedby links, without changing responses by user-agent |
| Plain installation instructions | Static Markdown avoids parsing the help carousel | Implemented guide explaining SC/mods extraction, compatibility and cache rules |
| Sitemap and crawler policy | Established search discovery, also useful to agents | Implemented generated sitemap and permissive robots file; robots is advisory, not authorization |
| Search-engine structured site metadata | JSON-LD is established; agent use varies | Implemented WebSite metadata; no invented review scores, ratings or guaranteed rich results |
| Route-specific document titles/descriptions | Established browser metadata and accessibility | Implemented client-side updates from the shared route inventory |
| No-JavaScript fallback | Established HTML | Implemented links to static catalog and guide; interactive editors still need JavaScript |
| Skip navigation and named content target | Standard keyboard/accessibility behavior | Implemented shell skip link and focusable target; existing navigation and mod controls retain accessible names |
| Shareable mod filters | Standard query URLs for browser and HTTP clients | Implemented `q`, `version`, `sort`; back/forward restores filters without serializing private state |
| Shareable game-table filters | Standard query URLs | Implemented `q`, `category` for all eight catalog views |
| Virtualized grid data inaccessible to DOM-only readers | Common automation limitation | Existing six full JSON arrays now explicitly discoverable and searchable through MCP and WebMCP `query_game_data`; bounded pagination avoids scrolling every grid row |
| Native browser-callable actions | WebMCP is experimental; Chrome documents origin trial from 149 and local testing flags | Implemented feature-detected `document.modelContext.registerTool`, AbortSignal cleanup and bounded inputs |
| Stale `navigator.modelContext` examples | Older articles use a different API | Implemented current document API only; no speculative compatibility shims |
| Structured browser search | Supported where WebMCP exists | Implemented `search_mods`, returning current displayed releases and matching-cache eligibility |
| Agent-visible browser state | Avoid guessing selection from screenshots | Implemented `get_mod_selection`, including loading and download state |
| Visible browser filter actions | Useful for a human supervising an agent | Implemented `set_mod_filters` through the same component state and URL as the controls |
| Agent-assisted ZIP selection | Useful without automating filesystem actions | Implemented atomic `set_mod_selection`; validates all IDs, current cache eligibility, busy state and duplicate IDs before changing selection |
| Browser page discovery | Available where WebMCP exists | Implemented `list_pages` with allowlisted routes; no arbitrary URL execution |
| Cross-browser fallback | WebMCP is not universally available; standards positions differ | Ordinary semantic HTML and static endpoints work independently; native Firefox/Safari support is not claimed |
| Headless automation resilience | Accessible role/name locators work today | Fixed the shared router directive's missing hrefs, retained early mouse navigation, enabled normal keyboard/click links and preserved modified/new-tab clicks; URL state reduces fragile click sequences |
| Local MCP connection | SDK provides real stdio transport | Implemented server using official SDK v2, input validation, read-only hints, JSON results, pagination and resources |
| Hosted Streamable HTTP MCP | Available protocol, but requires a server/edge runtime | Documented deployment work below; not faked with a JSON file or deployed from this task |
| Remote MCP authorization/discovery | MCP authorization uses real HTTP endpoints and protected-resource metadata when authentication is required | Deferred with hosted service; public read-only data needs no login today; no fake OAuth metadata |
| Interactive MCP Apps panels | Available extension in compatible hosts, separate from WebMCP | Deferred a sandboxed catalog/config panel with a `ui://` resource and host bridge; the local server currently returns text and structured data |
| Native production WebMCP activation | Origin-trial enrollment/token requires site-owner registration and browser eligibility | Code is ready when API exists; no token fabricated, enrollment or browser configuration changed |
| Declarative WebMCP form annotations | Chrome offers experimental form attributes | Imperative tools chosen for Angular signals and custom selects; adding duplicate form tools would create duplicate actions |
| Angular experimental WebMCP wrappers | Available experimentally | Small isolated native adapter avoids coupling the app to another experimental framework API |
| Third-party WebMCP polyfills/extension bridges | Available in the ecosystem, with separate trust and permission implications | Not injected into visitors' browsers; users can bring an extension while ordinary UI remains usable |
| Browser JSON query for every game table | Six datasets are already static; Additions/Dragoons/character computations live in Angular | Six complete tables supported by MCP; exporting the other computed models remains a separate data extraction task |
| Deep links to an individual grid row/editor object | Possible, but composite identities differ by table/editor | Deferred; filter links and full JSON work now without inventing unstable IDs or changing editor state |
| Irongoon config schema and agent edits | Possible, but must preserve YAML validation and special-build semantics | Deferred typed builder tool design; existing controls remain accessible; no generic object mutation tool |
| Asset/editor action tools | Possible only after defining safe project/file scopes and undo behavior | Deferred; agents do not gain directory reads, uploads, arbitrary JS, filesystem writes or automatic project changes |
| Agent-triggered combined downloads | Technically possible but browser user activation and download handling vary | Selection is implemented; the normal Download Mods button performs packaging with existing integrity/path/conflict checks |
| Prerendered HTML for every route | Angular supports prerendering | Static machine views added now; full route prerendering needs separate browser-only editor isolation and hosting validation |
| Canonical/OG/social metadata per route | Standard metadata can improve link previews | Client metadata improved; crawler-specific prerendered previews/canonical alias policy remain follow-up work |
| HTTP freshness/compression/content types | Existing deployment gzips output and uses long-lived caching | Implemented explicit MIME types and no-cache metadata for agent files and source datasets in the existing build script; production CDN behavior still requires deployment validation |
| Markdown content negotiation | Possible with server/edge request handling | Explicit Markdown URLs and page-specific alternate links implemented; `Accept: text/markdown` negotiation needs an edge/runtime change |
| Hosted CORS policy | Needed by browser-hosted agents on other origins, not CLI fetchers | No wildcard credential policy added; configure approved origins only if a hosted API requires cross-origin browser access |
| Standardized agent identity/payment protocols | No need for payments or privileged agents on this public site | No wallet, token, agent identity verification, A2A server or credential flow added |
| Embedded on-site AI chat / browser built-in model | Possible but unrelated to bringing an agent | No API keys, model download or chat dependency required; transport interfaces remain model-independent |
| Verification of agent interfaces | Needs protocol and real browser evidence, not a build alone | Added actual stdio integration tests, adapter/selection/filter tests and browser checks; limits recorded below |

## Use it

From this checkout, run `npm ci`. `npm start` and `npm run build` regenerate static agent files. `npm run generate:agents` refreshes only those files. Generated files are checked in so direct `ng serve` and MCP use also have a baseline; regenerate after changing catalog or routes.

Configure any MCP client supporting local stdio processes with its equivalent of:

```json
{
  "mcpServers": {
    "dragoonmods": {
      "command": "node",
      "args": ["C:/webprojects/lodtools/web/tools/mcp-server.mjs"]
    }
  }
}
```

Use an absolute path for your checkout. Node must be available on the client's PATH. No API key is needed. `npm run mcp` is convenient interactively, but configure clients with `node` directly to keep npm banners off the protocol's stdout. The server reads only allowlisted public repository data and has no network fetch or mutation tools. It does not see a user's open browser session, saved versions, selected mods or local game files.

Example requests: “Find RB3 randomizers”, “Get the Lloyd mod's release status”, “Search items for potion, return the next 25 results”, “List the site tools”. Browser agents can additionally say “Show Irongoon in the mod catalog” or “Select Irongoon and No Stats for me”, then use the existing download control.

For WebMCP development, follow Chrome's current setup documentation, enable the local testing flag where available, then inspect `await document.modelContext.getTools()`. No origin-trial token is included. If the API is absent, the site operates normally. No cross-origin tools are exposed with `exposedTo`.

## Deployment follow-ups

This repository builds static S3/CloudFront content. A hosted MCP service would require a Node/edge endpoint, operational ownership, request limits and real transport compatibility testing. Start read-only with the same catalog/dataset contracts. Add OAuth and protected-resource discovery only if protected data or actions are introduced. Do not publish a static `/mcp` file and advertise it as a server.

The build script now overrides MIME types and cache metadata for the emitted agent files and public game datasets after the general year-long S3 sync. It retains gzip metadata. Production CloudFront policy, cached 404s, invalidations and origin paths still need deployment validation. Browser-only navigation still needs the existing SPA fallback. Do not cache a missing agent URL as the HTML app shell. No infrastructure outside this repository was edited or deployed.

## Sources and support status

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp): origin trial, feature setup and experimental availability
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api): current document API, tools, string results and AbortSignal lifecycle
- [WebMCP specification and implementation links](https://github.com/webmachinelearning/webmcp): evolving community draft and browser/agent implementation status
- [Chrome declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api): form annotations and user-facing agent actions
- [WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools): same-origin defaults, input boundaries and untrusted output hints
- [Official MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/): real local and hosted transports; installed server/client version 2.3.1
- [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview): interactive UI resources and host-dependent support
- [OpenAPI specification](https://spec.openapis.org/oas/v3.1.1.html): standard HTTP resource descriptions; the generated document uses compatible OpenAPI 3.1.0
- [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports): established stdio and Streamable HTTP concepts; SDK v2 handles protocol negotiation
- [llms.txt proposal](https://llmstxt.org/): optional discovery and Markdown link relations, not universal agent support
- [W3C page regions tutorial](https://www.w3.org/WAI/tutorials/page-structure/regions/): semantic navigation and content landmarks

## Validation record

Automated checks cover real MCP transport negotiation with both SDK v2 and a 2025 protocol client, input rejection, pagination and resource reads. Angular checks cover registration cleanup/policy errors, current-release ZIP eligibility, atomic selections, route restoration, page metadata and alternates, skip-link destinations, real router hrefs and existing mod/download/game-data behavior. Existing game-data regression assertions are retained.

The local browser returned 200 with correct MIME types for discovery files and OpenAPI. It restored `/mods?q=lloyd&version=RB3&sort=name`, reflected user input in query URLs, navigated real links, restored `/data/items?q=potion` (12/202 rows) and updated it to `q=sword` (15/202 rows). The skip link preserved that route/query and focused `page-content`. A test registry invoked the actual Mods page callbacks and confirmed visible selection updates and atomic rejection of Lloyd. This was an adapter simulation, not a native WebMCP execution.

The preview browser does not expose `document.modelContext`. Its snapshot/typing tools repeatedly timed out; a fresh tab supported DOM interaction and inspection. The alternate browser provider was unavailable. No Chrome flags, origin-trial settings or production services were changed. Native experimental browser support and production CDN behavior remain unverified.

Final results: 48 targeted Angular tests and three agent-interface tests pass. The production build passes with existing component stylesheet budget warnings. The initial bundle total is 478.57 kB, below the 500 kB warning budget after lazy-loading agent catalog code. TypeScript and touched-file ESLint checks pass. Full-project lint reports 55 errors and one warning in other existing code, including CRLF templates and graph-display typing/case-block rules; none of its error files were changed by this work. Build YAML parsing, Bash syntax checks for the metadata upload loop, and `git diff --check` pass. No AWS upload was executed.

## Before and after

The shared navigation input was `routerLink:appFastRouterLink` while every consumer set `fastRouterLink`, leaving actual hrefs empty. It now maps `routerLink:fastRouterLink`, so RouterLink generates `/mods`, `/data/summary` and the other real destinations. Ordinary mouse-down navigation still runs early; middle/modified clicks and `_blank` targets use browser behavior.

```diff
 hostDirectives: [{
   directive: RouterLink,
-  inputs: ['routerLink:appFastRouterLink'],
+  inputs: ['routerLink:fastRouterLink', 'target'],
 }]
```

Mod inputs previously called `query.set(...)` or `version.set(...)` only. They now call `setFilters(...)`, which updates the same signals and merges `q`, `version` and `sort` into the route. Query-param subscriptions restore links and browser history changes. Search updates replace the current history entry to avoid one Back step per typed character. Game-table filters use the same approach with `q` and `category`.

Previously, an HTTP client received an empty Angular root and had to execute the app to discover the catalog. It can now fetch the generated JSON/Markdown endpoints or use the real local MCP server. Browser tools read the current release service; they do not substitute the static snapshot for live UI data. Metadata advertises a catalog alternate on Mods and a full-table JSON alternate on the six exported data pages, removing stale alternates when navigating to editors.

## Every affected file

Paths are relative to the website repository. Generated snapshots remain derived from the catalog and route inventory; they are not independent authoring sources.

| Files | Why changed |
| --- | --- |
| `docs/agent-support.md` | Complete audit, current source links, setup, boundaries, before/after and verification |
| `angular.json` | Publish root static discovery files through the existing Angular asset pipeline |
| `aws/build-prod.yaml` | Explicit agent/data MIME types and revalidation metadata, without deploying |
| `package.json`, `package-lock.json` | Official MCP SDK development dependencies, generation and test commands |
| `src/assets/agent-routes.json` | Shared inventory for page metadata and agent discovery |
| `tools/generate-agent-data.mjs` | Generate catalog JSON/Markdown, guide, OpenAPI, manifest, robots and sitemap |
| `tools/mcp-server.mjs` | Read-only stdio tools and resources with allowlisted inputs |
| `tools/agent-interfaces.test.mjs` | Static/OpenAPI contract checks and real modern/legacy MCP sessions |
| `public/agent/index.json`, `public/agent/mods.json`, `public/agent/mods.md`, `public/agent/guide.md`, `public/agent/openapi.json` | Generated public snapshots and machine-readable interfaces |
| `public/llms.txt`, `public/robots.txt`, `public/sitemap.xml` | Generated public discovery and crawl entry points |
| `src/app/services/browser-agent.ts`, `src/app/services/browser-agent.spec.ts` | Isolate experimental registration, input validation, policy failure and cleanup |
| `src/app/services/browser-agent.service.ts`, `src/app/services/browser-agent.service.spec.ts` | Global live catalog/page tools and route-specific metadata/discovery |
| `src/app/components/mod-collection/mod-collection.component.ts`, `src/app/components/mod-collection/mod-collection.component.html`, `src/app/components/mod-collection/mod-agent.spec.ts` | Shared filter URL state and visible, validated browser agent selection actions |
| `src/app/components/game-data/catalog/game-data-catalog.component.ts`, `src/app/components/game-data/catalog/game-data-catalog.component.spec.ts` | Restore/persist catalog filters and preserve existing data assertions |
| `src/app/components/app-default/app.component.ts`, `src/app/components/app-default/app.component.html`, `src/app/components/app-default/app.component.css`, `src/app/components/app-default/app.component.spec.ts` | Initialize browser support and add a route-preserving keyboard skip link |
| `src/app/directives/fast-router-link.directive.ts`, `src/app/directives/fast-router-link.directive.spec.ts` | Fix real href/click/keyboard links and preserve browser modified-click behavior |
| `src/index.html` | Static agent discovery, site JSON-LD and no-JavaScript fallback links |
| `src/main.ts` | Enable fragment scrolling for stable mod-card and content anchors |
