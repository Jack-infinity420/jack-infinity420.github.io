# Cosmic intro — integration decision

**Decision:** Ship as a **standalone static page** under Hexo `source/cosmic-intro/index.html`, not as a Butterfly layout override.

**Rationale:**

- The demo is a full-screen Three.js experience with its own scroll narrative and no need for the theme header/sidebar.
- Keeping it outside the theme avoids maintaining a forked layout or fighting PJAX/inject on every page.
- `skip_render: cosmic-intro/**` in [_config.yml](../../_config.yml) passes the file through unchanged to `public/cosmic-intro/index.html`.

**Assets:** Planet and sky textures are copied into [source/images/cosmic/](../../source/images/cosmic/) so paths work at site root (`/images/cosmic/...`) on `hexo server` and production. The original spec copies remain under [specs/textures/](specs/textures/) for design work.

**URL:** `https://lvjf.space/cosmic-intro/` (or `/cosmic-intro/index.html` depending on server rules).

**Optional:** Add a nav item in [_config.butterfly.yml](../../_config.butterfly.yml) `menu` pointing to `/cosmic-intro/` when you want it discoverable from the main blog.

**Spec reference:** [specs/cosmic-intro-demo.html](specs/cosmic-intro-demo.html) — edit there for experiments; sync meaningful changes into `source/cosmic-intro/index.html` when ready to publish.
