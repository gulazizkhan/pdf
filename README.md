# ToolNest PDF Toolbox

A responsive static website starter for a PDF utility site.

## Files
- `index.html` — home page and tool dialog
- `styles.css` — responsive visual design
- `app.js` — tool interactions and browser-side PDF processing
- `privacy.html`, `terms.html`, `contact.html` — starter pages to review and customize
- `assets/favicon.svg` — site icon

## Run locally
1. Extract this ZIP.
2. Open `index.html` in Chrome or Edge.
3. Keep an internet connection available: `pdf-lib`, PDF.js, and Google Fonts are loaded from CDNs.

For a local development server, open the folder in VS Code and use Live Server, or run:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Deploy
This is a static site. Upload the project folder contents to a static host such as Netlify, Cloudflare Pages, or GitHub Pages (subject to each provider's current terms and limits). The root `index.html` must be at the published root.

## Current working tools
- Merge PDF
- Split PDF (each page or a page range)
- Rotate pages
- Remove pages
- Extract pages
- Images to PDF (JPG/PNG)
- PDF pages to PNG images
- Add watermark
- Add page numbers
- PDF information
- Basic selectable-text extraction
- Rewrite/optimize PDF (does not guarantee compression)

## Not implemented yet
- Password protection/encryption
- Unlocking password-protected PDFs
- OCR for scanned PDFs
- Reliable image recompression for true PDF compression
- AdSense or analytics

## Before public launch
1. Test each tool using non-sensitive sample files and different browsers.
2. Replace ToolNest branding if desired.
3. Update the Contact page with an address you control.
4. Review and adapt Privacy Policy and Terms to match actual practices.
5. Add original helpful content for each tool and improve accessibility/SEO.
6. Review Google's current AdSense eligibility, consent, and policy requirements. Approval is not guaranteed.
7. Confirm the current hosting provider's free-plan terms and limits.

## Privacy note
The implemented processing tools are designed to run in the browser. Third-party libraries are loaded from CDNs, which receive standard network requests. Do not claim that the website is completely private or secure without reviewing the full deployment and dependencies.
