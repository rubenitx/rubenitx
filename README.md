<!--
  ─────────────────────────────────────────────────────────────
  rubenmtzb · profile README
  Design tokens (mirrors rubenitx.me)
    bg #030712 · surface #0B1120 · border #1E293B
    primary #0A84FF · accent #00E5FF / #00D9FF · muted #94A3B8
  Assets are local and generated — nothing here calls a third-party
  image service at render time.
    assets/chrome   header, divider, footer, principles panel
    assets/covers   project cover art
    assets/badges   stack sheet, per-project tech strips, link buttons
    assets/tags     status pills
    assets/media    claude.gif, soundtrack.png
  Regenerate generated assets with:
    node tools/build-chrome.mjs   header + footer
    node tools/build-badges.mjs   badge sheets, tech strips, link buttons
  ─────────────────────────────────────────────────────────────
-->

<p align="center">
  <img src="assets/chrome/header.svg" alt="Rubén Martínez Bernabe — Software Engineer, Barcelona" width="100%" />
</p>

<p align="center">
  <a href="https://rubenitx.me"><img src="assets/badges/link-portfolio.svg" height="36" alt="Portfolio" /></a>
  <a href="https://www.linkedin.com/in/rubenmartinezbernabe/"><img src="assets/badges/link-linkedin.svg" height="36" alt="LinkedIn" /></a>
  <a href="mailto:rmartbernabe@gmail.com"><img src="assets/badges/link-email.svg" height="36" alt="Email" /></a>
  <a href="https://orcid.org/0009-0005-5467-8436"><img src="assets/badges/link-orcid.svg" height="36" alt="ORCID" /></a>
</p>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `00` &nbsp;//&nbsp; Identity

Full-Stack Developer with solid experience in the **Java ecosystem**. I turn complex problems into efficient, scalable and robust solutions for large-scale projects — backend services with **Spring Boot**, interactive frontends with **React**, and a track record in REST API design, batch processing and Liferay portal development.

Clean domain boundaries, pragmatic decisions and systems that age well.

```json
{
  "role": "Software Engineer",
  "company": "Egarsat",
  "location": "Barcelona, Spain",
  "focus": "APIs, service integrations and web tools for everyday workflows",
  "mindset": "Systems thinking, constant iteration, obsession with detail",
  "currently": ["LLM-assisted workflows", "DevOps", "smart contracts"]
}
```

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `01` &nbsp;//&nbsp; Selected work

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://yt.rubenitx.me/"><img src="assets/covers/transcriber.svg" width="100%" alt="YouTubeTranscriber — captions pipeline" /></a>
      <p><img src="assets/tags/transcriber.svg" height="24" alt="Live · web app" /></p>
      <h3>YouTubeTranscriber</h3>
      <p>Turns a public YouTube video into timestamped text you can read, translate and reuse. Captions pipeline with <code>yt-dlp</code>, <code>whisper.cpp</code> fallback for videos without subtitles, and DeepL for dual-language output. No account required.</p>
      <p><img src="assets/badges/tech-transcriber.svg" height="26" alt="Java 21 · Spring Boot · Astro · React" /></p>
      <p><a href="https://yt.rubenitx.me/"><b>Open app&nbsp;↗</b></a> · <a href="https://rubenitx.me/work/youtube-transcriber/">Read the case</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://rubenitx.me/work/finance-core/"><img src="assets/covers/financecore.svg" width="100%" alt="FinanceCore — decoupled financial engine and client layer" /></a>
      <p><img src="assets/tags/financecore.svg" height="24" alt="Private · product" /></p>
      <h3>FinanceCore</h3>
      <p>One workspace for accounts, spending, savings goals and crypto holdings. Decoupled architecture — financial engine and client layer evolve independently — with clean domain boundaries, observability and long-term maintainability as first-class concerns.</p>
      <p><img src="assets/badges/tech-financecore.svg" height="26" alt="React · TypeScript · FastAPI · PostgreSQL" /></p>
      <p><a href="https://rubenitx.me/work/finance-core/"><b>Read the case&nbsp;↗</b></a> · <i>private code, synthetic-data walkthrough</i></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="http://sarscov2-mutation-portal.urv.cat"><img src="assets/covers/sars.svg" width="100%" alt="SARS-CoV-2 mutation portal — mutations across the viral genome" /></a>
      <p><img src="assets/tags/sars.svg" height="24" alt="Live · research" /></p>
      <h3>The Mutational Landscape of SARS-CoV-2</h3>
      <p>Interactive portal for exploring mutations across the SARS-CoV-2 genome, built end to end with <b>Universitat Rovira i Virgili</b> — from design to production. Interdisciplinary work at the intersection of software engineering and bioinformatics, with results published in <i>IJMS</i>.</p>
      <p><img src="assets/badges/tech-sars.svg" height="26" alt="TypeScript · PHP · Python · D3.js" /></p>
      <p><a href="http://sarscov2-mutation-portal.urv.cat"><b>Open portal&nbsp;↗</b></a> · <a href="https://www.mdpi.com/1422-0067/24/10/9072">Publication</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://rubenitx.me"><img src="assets/covers/portfolio.svg" width="100%" alt="rubenitx.me — static bilingual portfolio with a hidden Godspeed mini-game" /></a>
      <p><img src="assets/tags/portfolio.svg" height="24" alt="Live · open source" /></p>
      <h3>rubenitx.me</h3>
      <p>Personal site and CV: static output, bilingual EN/ES, printer-ready résumé route and interactive case studies. And a Killua <i>Godspeed</i> mini-game hidden behind the header — three levels, section orbs and an electric aura. Because a portfolio should also be fun to break.</p>
      <p><img src="assets/badges/tech-portfolio.svg" height="26" alt="Astro · Tailwind CSS · TypeScript" /></p>
      <p><a href="https://rubenitx.me"><b>Visit&nbsp;↗</b></a> · <a href="https://rubenitx.me/cv/">CV</a></p>
    </td>
  </tr>
</table>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `02` &nbsp;//&nbsp; Stack

<p>
  <img src="assets/badges/stack.svg" width="100%" alt="Backend: Java, Spring Boot, Spring Batch, REST APIs, Liferay, Python, PHP. Frontend: React, TypeScript, JavaScript, Astro, Tailwind CSS, Vite, D3.js. Data: MySQL, PostgreSQL, MongoDB. Ops: Docker, Kubernetes, Jenkins, Terraform, GitHub Actions, NGINX, Grafana, Linux." />
</p>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `03` &nbsp;//&nbsp; Activity

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rubenmtzb/rubenmtzb/output/snake.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/rubenmtzb/rubenmtzb/output/snake-light.svg" />
    <img src="https://raw.githubusercontent.com/rubenmtzb/rubenmtzb/output/snake.svg" alt="A snake eating this year's contribution graph" width="100%" />
  </picture>
</p>

<p align="center"><sub>Regenerated every 12 hours by <a href="https://github.com/rubenmtzb/rubenmtzb/actions">GitHub Actions</a>, in the profile's own palette.</sub></p>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `04` &nbsp;//&nbsp; Working principles

<table>
  <tr>
    <td width="240" align="center">
      <img src="assets/media/claude.gif" width="200" alt="Pixel-art companion, idling" />
      <br />
      <sub><code>nen type: transmutation</code></sub>
      <br />
      <sub><i>turns caffeine into commits</i></sub>
    </td>
    <td valign="middle">
      <img src="assets/chrome/principles.svg" width="100%" alt="Working principles: architecture before code; ship it, then observe it; AI to code faster, not to think less; detail is not decoration." />
    </td>
  </tr>
</table>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `05` &nbsp;//&nbsp; Outside the code

<details>
  <summary><b>&nbsp;Climbing, travel &amp; mechanical keyboards</b> &nbsp;<code>expand</code></summary>
  <br />

  <p>Climbing walls and via ferratas, long walks in cities I don't know yet — Rome, London, Granada, Mallorca — and sunsets somewhere between places. The things that happen away from the screen are the ones that shape how I think about the ones on it.</p>

  <p>Mechanical keyboards are the hands-on version of the same obsession: every build balances layout, materials, switches, sound and feel. Not a desk accessory — a tool tuned around how I work.</p>

  <table>
    <tr>
      <td><code>build 01</code></td>
      <td><b>Neo65</b></td>
      <td><sub>65% · gasket mount · wired hotswap</sub></td>
      <td><img src="assets/tags/assembled.svg" height="24" alt="assembled" /></td>
    </tr>
    <tr>
      <td><code>build 02</code></td>
      <td><b>HHKB Professional Hybrid Type-S</b></td>
      <td><sub>60% · Topre 45g · Snow + Wasabi · hand-lubed</sub></td>
      <td><img src="assets/tags/daily.svg" height="24" alt="daily driver" /></td>
    </tr>
    <tr>
      <td><code>build 03</code></td>
      <td><b>EVO75</b></td>
      <td><sub>75% · butterfly leaf spring · tri-mode</sub></td>
      <td><img src="assets/tags/assembled.svg" height="24" alt="assembled" /></td>
    </tr>
    <tr>
      <td><code>build 04</code></td>
      <td><b>Corne V4</b></td>
      <td><sub>42-key split · RP2040 · low-profile</sub></td>
      <td><img src="assets/tags/wip.svg" height="24" alt="in progress" /></td>
    </tr>
  </table>

  <p><sub>There's a typing speed trial and a layer-by-layer build archive on <a href="https://rubenitx.me/#archive">rubenitx.me</a> if you want to hear them.</sub></p>
</details>

<table>
  <tr>
    <td width="190" align="center">
      <a href="https://music.apple.com/es/playlist/code-in-flow/pl.u-XkD0vNBTD4LVDko"><img src="assets/media/soundtrack.png" width="170" alt="Code in Flow — Apple Music playlist" /></a>
    </td>
    <td valign="middle">
      <h3>Coding soundtrack</h3>
      <p><b>Code in Flow</b> — downtempo, electronic textures and ambient beats for long sessions.<br />
      <sub>The playlist that most of the work above was written to.</sub></p>
      <p><a href="https://music.apple.com/es/playlist/code-in-flow/pl.u-XkD0vNBTD4LVDko"><b>Listen&nbsp;↗</b></a></p>
    </td>
  </tr>
</table>

<img src="assets/chrome/divider.svg" width="100%" alt="" />

## `06` &nbsp;//&nbsp; Contact

<p align="center">
  <b>A manual workflow, or systems that don't talk to each other?</b><br />
  <sub>Tell me what your team does today and where it gets stuck. I can help define and build the API,<br />integration or web interface you need — starting from scope and constraints, not from promises.</sub>
</p>

<p align="center">
  <a href="mailto:rmartbernabe@gmail.com"><img src="assets/badges/cta-email.svg" height="36" alt="Write to me" /></a>
  <a href="https://www.linkedin.com/in/rubenmartinezbernabe/"><img src="assets/badges/cta-linkedin.svg" height="36" alt="Let's connect" /></a>
  <a href="https://rubenitx.me/cv/"><img src="assets/badges/cta-cv.svg" height="36" alt="Read my CV" /></a>
  <a href="https://orcid.org/0009-0005-5467-8436"><img src="assets/badges/cta-research.svg" height="36" alt="Research" /></a>
</p>

<p align="center">
  <img src="assets/chrome/footer.svg" alt="" width="100%" />
</p>
