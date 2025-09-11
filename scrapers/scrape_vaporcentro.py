# scrapers/scrape_vaporcentro.py
import re, time, json, csv, argparse, os
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup as BS
import pandas as pd

# ------- Config -------
TARGET_CATEGORY_NAME = "POD Descartables/Desechables"
TARGET_CATEGORY_SLUG = "/categoria-producto/pod-descartables-desechables/"
# Si querés ser más estricto, podés añadir el dominio esperado:
BASE_DOMAIN = "vaporcentrovm.com.ar"
# ----------------------


HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    "Referer": "https://www.google.com/"
}

def clean_text(s):
    return re.sub(r"\s+", " ", s or "").strip()

def price_to_float(s):
    # "$ 30.000,00" -> 30000.00
    t = s.replace("\xa0", " ").replace("$", "").strip()
    t = t.replace(".", "").replace(",", ".")
    m = re.search(r"([\d\.]+)", t)
    return float(m.group(1)) if m else 0.0

def get_soup(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BS(r.text, "lxml")

def find_product_links(category_url):
    """Extrae todos los links de producto de ESA categoría, con paginación."""
    links, seen = [], set()
    page_url = category_url

    while page_url:
        soup = get_soup(page_url)

        # 1) WooCommerce clásico
        anchors = soup.select("ul.products li.product a.woocommerce-LoopProduct-link")
        # 2) Cualquier <a> dentro de li.product
        if not anchors:
            anchors = soup.select("ul.products li.product a")
        # 3) Fallback: cualquier <a> que apunte a /producto/
        if not anchors:
            anchors = soup.select('a[href*="/producto/"]')

        found = 0
        for a in anchors:
            href = a.get("href")
            if not href:
                continue
            # Sólo productos (evita enlaces a filtros, etc.)
            if "/producto/" in href and href not in seen:
                seen.add(href)
                links.append(href)
                found += 1

        print(f"   -> {found} links en {page_url}")

        # Paginación (next) — se queda dentro de la categoría
        next_a = soup.select_one("a.next.page-numbers, .woocommerce-pagination a.next, .page-numbers a.next")
        page_url = next_a.get("href") if next_a and next_a.get("href") else None

        time.sleep(1.0)  # ser amable
    return links

# --------------------------
# Sabores SOLO desde "Información adicional"
# --------------------------

def parse_flavors_from_additional_info(soup):
    """
    Busca sabores en la tabla de atributos de WooCommerce (Información adicional).
    Lee el valor de la fila cuyo TH sea 'Sabor' o 'Sabores' (case-insensitive).
    """
    # Posibles contenedores del tab "Información adicional"
    containers = [
        "#tab-additional_information",
        ".woocommerce-Tabs-panel--additional_information",
        ".woocommerce-product-attributes",              # la propia tabla
        ".product .woocommerce-product-attributes",
    ]

    table = None
    for sel in containers:
        el = soup.select_one(sel)
        # Si el contenedor YA es la tabla
        if el and ("woocommerce-product-attributes" in (el.get("class") or [])):
            table = el
            break
        # Si el contenedor no es la tabla, buscarla adentro
        if el:
            t = el.select_one(".woocommerce-product-attributes")
            if t:
                table = t
                break

    # Si todavía no la encontramos, buscar la tabla directo
    if not table:
        table = soup.select_one(".woocommerce-product-attributes")

    if not table:
        return []

    # Buscar TRs y detectar el TH "sabor"/"sabores"
    rows = table.select("tr")
    flavors_text = ""
    for tr in rows:
        th = tr.select_one("th, .woocommerce-product-attributes-item__label")
        td = tr.select_one("td, .woocommerce-product-attributes-item__value")
        if not th or not td:
            continue
        label = clean_text(th.get_text()).lower()
        if "sabor" in label:  # coincide "sabor" o "sabores"
            # Obtener el texto del TD. Puede venir con <a>, <br>, comas, etc.
            # Preferimos concatenar textos de <a> si existen:
            links = [clean_text(a.get_text()) for a in td.select("a")]
            if links:
                flavors_text = ", ".join([l for l in links if l])
            else:
                flavors_text = clean_text(td.get_text(" "))
            break

    if not flavors_text:
        return []

    # Normalizar separadores y partir
    # A veces vienen separados por comas, saltos, o " , "
    parts = re.split(r",|\||/|·|•|\n", flavors_text)
    flavors = []
    for p in parts:
        f = clean_text(p)
        if not f:
            continue
        # filtrar placeholders
        fl = f.lower()
        if fl in {"elige una opción", "seleccionar", "choose an option"}:
            continue
        # Heurística: evitar frases larguísimas (hasta 6 palabras)
        if len(f.split()) <= 6:
            flavors.append(f)

    # dedup manteniendo orden
    seen, dedup = set(), []
    for f in flavors:
        if f not in seen:
            seen.add(f)
            dedup.append(f)

    return dedup

# (Fallback opcional) del <select> si no hubo "Información adicional"
PLACEHOLDERS = {"", "elige una opción", "seleccionar", "choose an option"}
def parse_flavors_from_select_scoped(soup):
    product = soup.select_one("div.product, .type-product")
    if not product:
        return []

    candidates = product.select(
        'form.variations_form select, '
        'form.cart select, '
        'select#sabor, '
        'select[name*="attribute_"], '
        'select[name*="pa_"], '
        'select[name*="sabor"]'
    )

    # Prefiltrar selects que realmente son de "sabor"
    filtered = []
    for sel in candidates:
        name = (sel.get("name") or "").lower()
        sid  = (sel.get("id") or "").lower()
        data_attr = (sel.get("data-attribute_name") or "").lower()
        if "sabor" in name or "sabor" in sid or "sabor" in data_attr:
            filtered.append(sel)

    pool = filtered if filtered else candidates

    def extract_options(sel):
        opts = []
        for opt in sel.select("option"):
            txt_raw = opt.get_text()
            txt = clean_text(txt_raw).lower()
            if txt not in PLACEHOLDERS:
                opts.append(clean_text(txt_raw))
        # dedup
        seen, out = set(), []
        for o in opts:
            if o not in seen:
                seen.add(o); out.append(o)
        return out

    best_opts = []
    for sel in pool:
        opts = extract_options(sel)
        if len(opts) > len(best_opts):
            best_opts = opts

    return best_opts

def parse_product(url, category_id_default=1, category_name_default=TARGET_CATEGORY_NAME):
    soup = get_soup(url)

    # Título
    title_el = soup.select_one("h1.product_title, h1.entry-title, .product_title.entry-title")
    name = clean_text(title_el.get_text()) if title_el else ""

    # Precio
    price_el = soup.select_one(
        ".summary .price .woocommerce-Price-amount bdi, "
        ".price .woocommerce-Price-amount bdi, "
        ".summary .price, "
        ".price"
    )
    price_txt = clean_text(price_el.get_text()) if price_el else ""
    price = price_to_float(price_txt) if price_txt else 0.0
    if price == 0.0:
        m = soup.find(string=re.compile(r"\$\s*\d"))
        if m:
            price = price_to_float(str(m))

    # Short description
    short_el = soup.select_one(
        ".woocommerce-product-details__short-description, "
        ".short-description, "
        ".summary .woocommerce-product-details__short-description, "
        ".elementor-widget-woocommerce-product-short-description .elementor-widget-container"
    )
    short_description = clean_text(short_el.get_text(" ")) if short_el else ""

    # Descripción larga (SIN valoraciones)
    long_el = soup.select_one(
        "#tab-description, "
        ".woocommerce-Tabs-panel--description, "
        ".woocommerce-product-details__description, "
        ".woocommerce-tabs .panel.entry-content, "
        ".elementor-widget-woocommerce-product-data-tabs .woocommerce-Tabs-panel--description"
    )
    description = clean_text(long_el.get_text("\n")) if long_el else ""

    if not short_description and description:
        short_description = re.split(r"(?<=[.!?])\s+", description)[0][:200]

    # Stock (heurística)
    stock_el = soup.select_one(".stock")
    stock_txt = clean_text(stock_el.get_text()) if stock_el else ""
    stock = 0 if "agotado" in stock_txt.lower() or "sin stock" in stock_txt.lower() else 10

    # Imagen
    img_el = soup.select_one(".woocommerce-product-gallery__image img, .wp-post-image, .product img")
    img_src = ""
    if img_el:
        srcset = img_el.get("srcset")
        if srcset:
            pairs = []
            for part in srcset.split(","):
                p = part.strip().split()
                if len(p) >= 2 and p[1].endswith("w"):
                    try:
                        pairs.append((int(p[1][:-1]), p[0]))
                    except:
                        pass
            if pairs:
                pairs.sort(reverse=True)
                img_src = pairs[0][1]
        if not img_src:
            img_src = img_el.get("src") or img_el.get("data-src") or img_el.get("data-large_image") or ""
    image_url = urljoin(url, img_src) if img_src else ""

    # Categoría (breadcrumb)
    bc = soup.select(".woocommerce-breadcrumb a, nav.breadcrumb a")
    cat_name = category_name_default
    if bc:
        cat_name = clean_text(bc[-1].get_text()) or category_name_default
    if not cat_name:
        cat_name = TARGET_CATEGORY_NAME

    # Sabores: PRIORIDAD Información adicional -> fallback select
    flavors = parse_flavors_from_additional_info(soup)
    if not flavors:
        flavors = parse_flavors_from_select_scoped(soup)

    flavor_enabled = len(flavors) > 0

    item = {
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
    return item

def ensure_parent_dir(path):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def belongs_to_target_category(cat_name: str) -> bool:
    """Permite pasar SOLO si el breadcrumb coincide con la categoría objetivo."""
    if not cat_name:
        return False
    return TARGET_CATEGORY_NAME.lower() in cat_name.lower()

def main(category_url, out_json, out_csv, limit=None):
    # Sanidad: aseguramos que la URL sea la categoría correcta
    if TARGET_CATEGORY_SLUG not in category_url:
        print(f"[!] Advertencia: la URL dada no parece ser la categoría objetivo:\n    {category_url}")
        print(f"    Se esperaba que contenga: {TARGET_CATEGORY_SLUG}")

    print(f"[+] Listando productos desde categoría: {category_url}")
    product_links = find_product_links(category_url)
    if limit:
        product_links = product_links[:int(limit)]
    print(f"[+] Encontrados {len(product_links)} links")

    items = []
    for i, link in enumerate(product_links, 1):
        try:
            print(f"  - ({i}/{len(product_links)}) {link}")
            item = parse_product(link, category_id_default=1, category_name_default=TARGET_CATEGORY_NAME)

            # FILTRO DURO POR CATEGORÍA (evita colados)
            if not belongs_to_target_category(item.get("category_name", "")):
                print("    · skip: fuera de categoría objetivo ->", item.get("category_name"))
                continue

            items.append(item)
            time.sleep(1.0)
        except Exception as e:
            print(f"    ! Error en {link}: {e}")

    # Guardar JSON / CSV (sobrescriben)
    if out_json:
        ensure_parent_dir(out_json)
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[✓] JSON -> {out_json}")

    if out_csv:
        ensure_parent_dir(out_csv)
        rows = []
        for it in items:
            rows.append({
                **{k: v for k, v in it.items() if k != "flavors"},
                "flavors": "|".join(it.get("flavors", []))
            })
        df = pd.DataFrame(rows)
        df.to_csv(out_csv, index=False)
        print(f"[✓] CSV -> {out_csv}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", required=True, help="URL de la categoría de WooCommerce")
    ap.add_argument("--json", default="data/desechables.json")
    ap.add_argument("--csv", default="data/desechables.csv")
    ap.add_argument("--limit", type=int, default=None, help="Limitar cantidad (debug)")
    args = ap.parse_args()
    main(args.category, args.json, args.csv, args.limit)
