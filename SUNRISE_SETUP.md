# Sunrise storefront — Shopify Admin setup

This theme is Shopify's Dawn 16.0.0 plus the Sunrise sections (`sections/sunrise-*.liquid`).
The pages read real store data, so a few things must exist in Shopify Admin before they display fully.

## 1. Product and bundle variants (required for the Buy 1 / Buy 2 selector)

On the Sunrise Alarm Clock product, add one option (e.g. **Bundle**) with two values:

| Variant    | Price  | Compare-at price |
|------------|--------|------------------|
| `1 Clock`  | 53.98  | 89.99            |
| `2 Clocks` | 79.99  | 179.98           |

- The bundle cards find these by option value (`1 Clock`, `2 Clocks`). If you use different names, change
  **Variant option value** on each *Bundle offer* block (Theme editor → Product page → Sunrise product).
- Choosing Buy 2 adds **one unit of the `2 Clocks` variant** at $79.99. Fulfil it as two clocks
  (e.g. give the variant its own SKU/packing note). For automatic two-unit inventory deduction, build it with
  the **Shopify Bundles** app instead and pick that product in the block's **Or: separate bundle product** field.
- If the `2 Clocks` variant is missing, the Buy 2 card and the homepage bundle promo are hidden rather than shown
  with a price that can't be charged.
- Upload product images with alt text — the alt text is used as the thumbnail caption (e.g. "Sunrise glow").

## 2. Content to confirm and fill in (hidden until filled)

- **Product page → Sunrise product → Dispatch time / Delivery estimate**: the delivery timeline appears only
  when both are set. Match your shipping settings.
- **Trust items** "Tracked delivery" and "Clear returns" (product page) and "Tracked delivery" / "Easy returns"
  (homepage hero) are added but **disabled** — enable them only if they're true for your store.
- **Product details → Specifications / What's included**: empty, so hidden. Fill them in or connect metafields.
- **FAQ "What's in the box?"**: no answer yet, so hidden.
- Alarm sounds and brightness/sunrise-duration settings were marked "confirm" in the design and are not shown.

## 3. Store settings the theme links to

- **Settings → Policies**: add Shipping and Refund policies (used by the accordions, the FAQ links and the
  price note).
- **Online Store → Navigation**: `main-menu` (header and footer "Shop" column — e.g. Shop, Sunrise Alarm Clock,
  Help) and `footer` (footer "Help" column — e.g. Shipping, Returns, Contact, FAQ).
- A **Contact** page with handle `contact` (the homepage "Email support" item links to `/pages/contact`).
- **Theme editor → Sunrise hero**: upload the lifestyle hero image (a warm glow shows until you do).

## 4. Reviews

Install a review app (Shopify Product Reviews, Judge.me, Okendo, Loox, Yotpo…). Then in the Theme editor add the
app's block to the **Sunrise reviews** section on the product page and homepage. Star ratings appear
automatically once the app writes the standard `reviews.rating` / `reviews.rating_count` metafields. With no app
and no ratings, the review sections and stars stay hidden.
