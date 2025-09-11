# scrapers/scrape_vapeclub.py
import re, time, json, csv, argparse, os
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup as BS
import pandas as pd

# ------- Config -------
TARGET_CATEGORY_NAME = "PODS DESCARTABLES"
TARGET_CATEGORY_SLUG = "/pods-descartables"
BASE_DOMAIN = "www.vapeclub.com.ar"
# ----------------------

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    "Referer": "https://www.google.com/"
}

PLACEHOLDERS = {"", "elige una opción", "seleccionar", "choose an option", "seleccioná una opción", "Seleccione una opción"}

# ---------------- Utiles ----------------
def clean_text(s):
    return re.sub(r"\s+", " ", s or "").strip()

def price_to_float(s):
    t = (s or "").replace("\xa0", " ").replace("$", "").strip()
    t = t.replace(".", "").replace(",", ".")
    m = re.search(r"([\d\.]+)", t)
    return float(m.group(1)) if m else 0.0

def get_soup(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BS(r.text, "lxml")

# --------------- Listado categoría ---------------
def _is_product_detail(full_url: str) -> bool:
    try:
        p = urlparse(full_url)
        if BASE_DOMAIN not in p.netloc:
            return False
        parts = [x for x in p.path.split("/") if x]
        return len(parts) >= 2 and parts[0] == "productos"
    except:
        return False

def find_product_links(category_url):
    links, seen = [], set()
    page_url = category_url

    while page_url:
        soup = get_soup(page_url)
        anchors = soup.select('a[href*="/productos/"]')
        found = 0
        for a in anchors:
            href = a.get("href") or ""
            full = urljoin(page_url, href)
            if _is_product_detail(full) and not full.rstrip("/").endswith("/productos"):
                if full not in seen:
                    seen.add(full)
                    links.append(full); found += 1
        print(f"   -> {found} links en {page_url}")

        next_a = soup.select_one('a[rel="next"], .pagination a[rel="next"], .pagination a.next')
        page_url = urljoin(page_url, next_a.get("href")) if next_a else None
        time.sleep(1.0)

    return links

# --------------- Sabores ---------------
def _product_root(soup):
    return soup.select_one('main, article.product, .product, #product-app, .product-page') or soup

def _add_opts_into(seen, out_list, candidates):
    for raw in candidates:
        t = clean_text(raw)
        low = t.lower()
        if not t or low in PLACEHOLDERS:
            continue
        if low.startswith("branch_"):
            continue
        # si querés excluir colores genéricos, dejá esta línea; si no, quitála
        if low in {"white","black","blue","yellow","orange","green","forrest green","red","pink"}:
            continue
        if t not in seen:
            seen.add(t); out_list.append(t)

def parse_flavors_tiendanube(soup):
    """
    Extrae SABORES desde el grupo de variantes que tiene un label 'SABOR/Sabores'.
    Compatible con botones <a class="js-insta-variant" data-option="...">,
    selects y radios. Scope ESTRICTO dentro del grupo identificado.
    """
    root = _product_root(soup)
    flavors, seen = [], set()

    # 1) Grupos típicos de variantes en Tienda Nube
    variant_groups = root.select(
        ".js-product-variants-group, .product-variants, .sku-selector, "
        "[class*='variantes'], [class*='variations'], .variant-selector, form[action]"
    )
    if not variant_groups:
        variant_groups = [root]

    # 2) Filtrar SOLO los grupos cuyo label diga 'Sabor/Sabores'
    sabor_groups = []
    for g in variant_groups:
        lbl = g.select_one("label.form-label, label, .variant-name, .options__title, .label, h3, h4, h5")
        if lbl and re.search(r"\bsabor(es)?\b", clean_text(lbl.get_text()), re.I):
            sabor_groups.append(g)
    if not sabor_groups:
        # fallback: buscá un label en todo el root y tomá su padre
        for lbl in root.select("label.form-label, label, .variant-name, .options__title, .label"):
            if re.search(r"\bsabor(es)?\b", clean_text(lbl.get_text()), re.I):
                sabor_groups.append(lbl.parent)

    # 3) Dentro de cada grupo, levantamos opciones
    for g in (sabor_groups or variant_groups):
        # 3.a) BOTONES de opción (lo del screenshot)
        # <a class="js-insta-variant ..." data-option="PEACH+">PEACH+</a>
        anchors = g.select("a.js-insta-variant[data-option], a[data-option], button[data-option]")
        _add_opts_into(seen, flavors, [a.get("data-option") or a.get("title") or a.get_text() for a in anchors])

        # 3.b) Radios con label for
        for r in g.select('input[type="radio"]'):
            rid = r.get("id")
            lab = soup.select_one(f'label[for="{rid}"]') if rid else None
            txt = lab.get_text() if lab else (r.get("value") or r.get("data-value") or r.get("aria-label") or "")
            _add_opts_into(seen, flavors, [txt])

        # 3.c) Selects (si el select es de sabor por nombre/label cercano)
        for sel in g.select("select"):
            near = sel.find_previous_sibling(["label","div","span"])
            near_txt = clean_text(near.get_text()).lower() if near else ""
            name = (sel.get("name") or "").lower()
            data_attr = (sel.get("data-attribute-name") or "").lower()
            if ("sabor" in near_txt) or ("sabor" in name) or ("sabor" in data_attr):
                opts = [clean_text(opt.get_text()) for opt in sel.select("option")
                        if clean_text(opt.get_text()).lower() not in PLACEHOLDERS]
                _add_opts_into(seen, flavors, opts)

        # 3.d) Chips genéricos dentro del grupo
        chips = g.select(".option, .choice, .swatch, .options .item, .sku-selector__option, [role='option']")
        _add_opts_into(seen, flavors, [c.get_text() for c in chips])

        if flavors:
            break  # ya encontramos sabores válidos, no seguir buscando en otros grupos

    return flavors


# --------------- Producto ---------------
def _parse_jsonld_product(soup):
    for sc in soup.select('script[type="application/ld+json"]'):
        try:
            j = json.loads(sc.string or "{}")
        except Exception:
            continue
        items = j if isinstance(j, list) else [j]
        for it in items:
            if isinstance(it, dict) and it.get("@type") in ("Product", ["Product"]):
                data = {}
                data["name"] = it.get("name") or ""
                data["description"] = it.get("description") or ""
                offers = it.get("offers") or {}
                if isinstance(offers, list): offers = offers[0] if offers else {}
                price = offers.get("price") or ""
                data["price"] = price_to_float(str(price)) if price else 0.0
                img = it.get("image")
                if isinstance(img, list) and img: data["image"] = img[0]
                elif isinstance(img, str): data["image"] = img
                return data
    return {}

def _product_h1(soup):
    for sel in ["h1.product__name","h1.product-name","h1.product_title","h1.titulo","h1.entry-title","h1"]:
        el = soup.select_one(sel)
        if el and clean_text(el.get_text()):
            return clean_text(el.get_text())
    meta = soup.select_one('meta[property="og:title"]')
    return clean_text(meta.get("content")) if meta else ""

def _product_description_block(soup):
    root = _product_root(soup)
    heading = None
    for h in root.select("h1,h2,h3,h4,h5,h6"):
        if re.search(r"^descrip(ci|í)on$", clean_text(h.get_text()), re.I):
            heading = h; break
    if heading:
        texts = []
        for sib in heading.find_all_next():
            if sib.name in ["h1","h2","h3","h4","h5","h6"]:
                break
            if sib.get("id") in {"reviewsapp"} or ("social-share" in " ".join(sib.get("class", []))):
                break
            if sib.name in ["p","li"]:
                texts.append(clean_text(sib.get_text(" ")))
            elif sib.name in ["ul","ol","div","section"]:
                texts.append(clean_text(sib.get_text(" ")))
        txt = clean_text("\n".join([t for t in texts if t]))
        if txt: return txt
    for sel in [".user-content", ".product-description", ".product__description", "#descripcion", ".tabs .tab-content", ".description"]:
        el = root.select_one(sel)
        if el and clean_text(el.get_text()):
            return clean_text(el.get_text("\n"))
    return ""

def parse_product(url, category_id_default=1, category_name_default=TARGET_CATEGORY_NAME):
    soup = get_soup(url)

    # NAME: priorizar H1; JSON-LD solo si falta
    name = _product_h1(soup)
    jld = _parse_jsonld_product(soup) if not name else {}

    if not name and jld.get("name"):
        name = clean_text(jld["name"])

    # PRICE
    price = 0.0
    price_el = soup.select_one('[itemprop="price"], meta[itemprop="price"], meta[property="product:price:amount"], .product__price-amount, .product-price, .price')
    if price_el:
        price_txt = price_el.get("content") if price_el.has_attr("content") else clean_text(price_el.get_text())
        price = price_to_float(price_txt)
    if price == 0.0 and jld.get("price"):
        price = jld["price"]
    if price == 0.0:
        m = soup.find(string=re.compile(r"\$\s*\d"))
        price = price_to_float(str(m)) if m else 0.0

    # DESCRIPTION (bloque “Descripción”)
    description = _product_description_block(soup)
    if not description and jld.get("description"):
        description = clean_text(jld["description"])
    short_description = re.split(r"(?<=[.!?])\s+", description)[0][:200] if description else ""

    # STOCK (heurística)
    stock_el = soup.select_one(".stock, .product__availability, .availability")
    stock_txt = clean_text(stock_el.get_text()) if stock_el else ""
    stock = 0 if re.search(r"agotado|sin stock|no disponible", stock_txt, re.I) else 10

    # IMAGE
    image_url = ""
    img_meta = soup.select_one('meta[property="og:image"]')
    if img_meta and img_meta.get("content"):
        image_url = urljoin(url, img_meta["content"])
    if not image_url and jld.get("image"):
        image_url = urljoin(url, jld["image"])
    if not image_url:
        img_el = soup.select_one(".product__gallery img, .product-gallery img, img.product__image, .product img, .gallery__image img")
        if img_el:
            image_url = urljoin(url, img_el.get("src") or img_el.get("data-src") or "")

    # CATEGORY
    bc = soup.select("nav.breadcrumb a, .breadcrumb a, [aria-label='breadcrumb'] a")
    cat_name = clean_text(bc[-1].get_text()) if bc else category_name_default
    if not cat_name: cat_name = TARGET_CATEGORY_NAME

    # FLAVORS (con fallback en 3 capas)
    flavors = parse_flavors_tiendanube(soup)
    flavor_enabled = len(flavors) > 0

    return {
        "source_url": url,
        "name": name,
        "short_description": short_description,
        "description": description,
        "price": price,
        "stock": stock,
        "brand": "",
        "category_id": category_id_default,
        "category_name": cat_name or category_name_default,
        "image_url": image_url,
        "flavor_enabled": flavor_enabled,
        "flavors": flavors,
    }

# --------------- IO + MAIN ---------------
def ensure_parent_dir(path):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def belongs_to_target_category(cat_name: str) -> bool:
    return bool(cat_name) and TARGET_CATEGORY_NAME.lower() in cat_name.lower()

def main(category_url, out_json, out_csv, limit=None):
    if TARGET_CATEGORY_SLUG not in category_url:
        print(f"[!] Advertencia: la URL dada no parece ser la categoría objetivo:\n    {category_url}")
        print(f"    Se esperaba que contenga: {TARGET_CATEGORY_SLUG}")

    print(f"[+] Listando productos desde categoría: {category_url}")
    product_links = find_product_links(category_url)
    if limit: product_links = product_links[:int(limit)]
    print(f"[+] Encontrados {len(product_links)} links")

    items = []
    for i, link in enumerate(product_links, 1):
        try:
            print(f"  - ({i}/{len(product_links)}) {link}")
            it = parse_product(link, category_id_default=1, category_name_default=TARGET_CATEGORY_NAME)
            if not belongs_to_target_category(it.get("category_name", "")):
                print("    · skip: fuera de categoría objetivo ->", it.get("category_name")); continue
            items.append(it)
            time.sleep(1.0)
        except Exception as e:
            print(f"    ! Error en {link}: {e}")

    if out_json:
        ensure_parent_dir(out_json)
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[✓] JSON -> {out_json}")

    if out_csv:
        ensure_parent_dir(out_csv)
        rows = []
        for it in items:
            rows.append({**{k: v for k, v in it.items() if k != "flavors"}, "flavors": "|".join(it.get("flavors", []))})
        pd.DataFrame(rows).to_csv(out_csv, index=False)
        print(f"[✓] CSV -> {out_csv}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", required=True, help="URL de la categoría Tienda Nube")
    ap.add_argument("--json", default="data/desechables.json")
    ap.add_argument("--csv", default="data/desechables.csv")
    ap.add_argument("--limit", type=int, default=None, help="Limitar cantidad (debug)")
    args = ap.parse_args()
    main(args.category, args.json, args.csv, args.limit)
