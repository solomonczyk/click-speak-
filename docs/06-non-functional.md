# Non-Functional Requirements — Click&Speak

**Версия:** 1.0.0  
**Дата:** 2026-05-23

---

## 1. Performance

### 1.1 Web Vitals (production, mobile emulation)

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | ≤ 2.5 s | Lighthouse mobile |
| INP | ≤ 200 ms | Lighthouse |
| CLS | ≤ 0.1 | Lighthouse |
| Lighthouse Performance score | ≥ 85 | `/`, `/decks` |

### 1.2 Application-specific

| Operation | Target (p50 / p95) |
|-----------|-------------------|
| Quick Add enrich (online) | 2 s / 4 s |
| Card flip animation | 600 ms (fixed) |
| Deck list load (100 decks, 5k cards) | 300 ms / 800 ms |
| Build review queue (500 due) | 200 ms / 500 ms |
| Audio start playback (cached) | 100 ms / 300 ms |
| Audio start playback (network) | 500 ms / 1.5 s |

### 1.3 Bundle size (goals)

| Route | Max gzip |
|-------|----------|
| `/learn` initial JS | 200 KB |
| Shared vendor chunk | 150 KB |

Code splitting: Learn route lazy-loaded; charts library only on `/statistics`.

---

## 2. Reliability & data integrity

| Requirement | Detail |
|-------------|--------|
| SRS persistence | Grade saved to IndexedDB before next card shown |
| Session recovery | Refresh mid-session → resume queue from Dexie (same session id) |
| Export integrity | Export JSON validates against schema; round-trip import test |
| Dexie upgrade | v1→v2 migration without data loss (automated test) |
| Offline replay | Cached `audioBlobs` play without network |
| Offline Quick Add | Blocked with clear message; manual card create allowed |

**RPO/RTO (MVP local):** пользователь отвечает за backup через Export; RPO = last export.

---

## 3. Security

| Area | Requirement |
|------|-------------|
| Transport | HTTPS only in production |
| Secrets | API keys server-side only; no `NEXT_PUBLIC_*` for secrets |
| Input validation | Zod on all API routes and forms |
| XSS | No `dangerouslySetInnerHTML` without sanitize |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.*` |
| Logging | No plaintext `term` in server logs |
| Dependencies | `npm audit` — no high/critical on release |
| Rate limiting | BFF 30/60 rpm per IP |

**Threat model MVP:** untrusted user input in term field; mitigated by length limits and no HTML rendering.

---

## 4. Privacy

| Principle | Implementation |
|-----------|----------------|
| Data minimization | No account, no email in MVP |
| Local storage | All vocabulary in browser IndexedDB |
| Third parties | Enrichment sends term to dictionary/translate/TTS — disclose in Settings |
| Analytics | None in MVP; if added — opt-in, anonymized |
| Export | User owns JSON file |
| Clear data | Settings → «Удалить все данные» with confirmation |

**GDPR note (Phase 2):** privacy policy, DPA with TTS vendor, right to erasure on account delete.

---

## 5. Accessibility (WCAG 2.1 AA target)

| Criterion | Requirement |
|-----------|-------------|
| 1.4.3 Contrast | Body text ≥ 4.5:1 on background |
| 2.1.1 Keyboard | Full Learn flow without mouse |
| 2.4.7 Focus | Visible focus ring on interactive elements |
| 4.1.2 Name, Role, Value | SRS buttons labeled |
| 2.3.3 Animation | Respect `prefers-reduced-motion` |

Testing: axe-core in CI on main routes; manual screen reader spot-check (NVDA/VoiceOver).

---

## 6. Internationalization (i18n)

| Aspect | MVP |
|--------|-----|
| UI strings | Russian (`ru`) |
| Card content | Per deck language pair |
| Date/number format | `ru-RU` locale |
| RTL | Out of scope |
| Framework | `next-intl` or simple JSON dictionary |

Keys structure: `learn.reveal_hint`, `decks.import_csv`, etc.

---

## 7. Browser & device support

| Browser | Versions |
|---------|----------|
| Chrome | Last 2 |
| Firefox | Last 2 |
| Safari (macOS) | Last 2 |
| Safari (iOS) | 16+ |
| Edge | Last 2 |

| Viewport | Support |
|----------|---------|
| 320px–767px | Mobile layout |
| 768px–1023px | Tablet |
| 1024px+ | Desktop |

**Not supported:** IE11, Opera Mini.

---

## 8. Usability

| Requirement | Detail |
|-------------|--------|
| Touch targets | ≥ 44×44 px mobile |
| Error messages | Russian, actionable |
| Loading states | Skeleton/spinner &gt; 300ms |
| Confirm destructive | Delete deck, clear data, exit session |
| First-run | Optional 3-step onboarding (Phase 2); MVP tooltip on FAB |

---

## 9. Maintainability

| Practice | Requirement |
|----------|-------------|
| TypeScript | `strict: true` |
| Lint | ESLint + Prettier in CI |
| Tests | SRS unit 100%; E2E critical paths (Playwright) |
| Docs | Update docs when FR changes |
| Commits | Conventional commits recommended |

---

## 10. Scalability (Phase 2 forward-looking)

| Dimension | MVP | Phase 2 |
|-----------|-----|---------|
| Users | Single browser | Multi-tenant server |
| Cards per user | ~10k local | 100k+ cloud |
| TTS | Per-request | Cached S3 + CDN |

---

## 11. Compliance & legal (placeholder)

- Terms of Service — before public launch  
- Privacy Policy — before cloud sync  
- API vendor ToS — DeepL, Azure compliance  

---

## 12. Monitoring & SLO (Phase 2)

| SLO | Target |
|-----|--------|
| BFF enrich availability | 99.5% monthly |
| p95 enrich latency | &lt; 5s |

MVP: Vercel analytics + error logging optional.

---

## 13. Связанные документы

- [07-acceptance-criteria.md](./07-acceptance-criteria.md)  
- [03-architecture.md](./03-architecture.md)  
- [01-product-vision-prd.md](./01-product-vision-prd.md)
