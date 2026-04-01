# TaxMetall n8n Community Node — Agent Info

## Paket
- **npm:** `@vectotaxsoftwaregmbh/n8n-nodes-taxmetall`
- **GitHub:** `https://github.com/Vectotax/n8n-nodes-taxmetall`
- **npm-Org:** `vectotaxsoftwaregmbh` (Account: `vectotax-ksteinfeld`)
- **Git-Author:** `vt-ksteinfeld` / `ksteinfeld@vectotax.de`

## Nodes
- `nodes/TaxMetall/TaxMetall.node.ts` — ERP-Node (Kunden, Artikel, Aufträge, Angebote, Rechnungen, Lieferscheine, Eingangsrechnungen, Lieferanten, Mahnungen, Akquise)
- `nodes/TaxMetallStatistics/TaxMetallStatistics.node.ts` — Statistik-Node (dynamische Auswertungen per API)
- `credentials/TaxMetallApi.credentials.ts` — API Key + Basis-URL

## Release-Prozess
```bash
npm run lint       # Prüfung
npm run release    # Versionsbump + npm publish + GitHub Release
```
`npm run release` fragt interaktiv nach patch/minor/major. Danach Browser-Auth bei npm.

## Wichtige Hinweise
- Scoped Package → beim manuellen `npm publish` immer `--access public` angeben
- `.svn/`, `dist/`, `node_modules/`, `.vscode/`, `package-lock.json` sind in `.gitignore`
- n8n findet den Node automatisch über das Keyword `n8n-community-node-package` in `package.json`
- Nutzer installieren über: n8n → Settings → Community Nodes → Install → `@vectotaxsoftwaregmbh/n8n-nodes-taxmetall`
