# G Mart — Online Store (Demo)

A fast, responsive online-shopping demo (Amazon / Flipkart style) built as a static site.

**🔗 Live:** https://ayanv3419-oss.github.io/g-mart/

## Features
- **14 categories**, 200+ branded products with full hierarchy (Category → Subcategory), variants, pack sizes, ratings &amp; specs
- Amazon-style **dark header + category nav**, rotating promo banner, multi-card homepage
- **Product detail pages**, shopping cart, checkout &amp; order-confirmation flow (demo — no real payments)
- Real product photos on clean **white backgrounds**
- Premium, fully **responsive** UI — vanilla HTML / CSS / JS, no framework

## Tech
Static single-page site. The catalog lives in `catalog.json`, product photos in `img/p/`, and everything is assembled into `index.html` by `build.js`. Run locally with `node server.js` (serves on `http://localhost:4321`).

---
Built by Ayan Mansuri · for demonstration only.
