# backend/app/routes/mercadopago_bp.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
import mercadopago
import os
from datetime import datetime
from ..models import Order, OrderItem, Product, User
from ..database import db
from flask import current_app
# ==== Helpers de Email (SMTP directo, sin Flask-Mail) ====
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def format_currency_ars(n):
    try:
        n = float(n or 0)
    except Exception:
        n = 0.0
    # Separador de miles simple; ajustá si querés formato más local
    return f"${int(n):,}".replace(",", ".")

def build_order_email_html(order_id, customer_name, customer_email, items, total_amount, created_at_iso, shipping_address_text):
    """
    Genera el HTML del mail de confirmación de pedido.
    items: lista de dicts {title, quantity, unit_price, subtotal}
           title ya puede incluir el sabor elegido (ej: "Pod Vaper (Frutilla Ice)").
    """
    # ✅ Si por alguna razón title no incluye el sabor, aseguramos que aparezca
    rows_html = "\n".join([
        f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">
            {i['title']}
            {"<br><small style='color:#555'>Sabor: " + i.get('selected_flavor','') + "</small>" if i.get('selected_flavor') else ""}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">{i['quantity']}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">{format_currency_ars(i['unit_price'])}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">{format_currency_ars(i['subtotal'])}</td>
        </tr>
        """
        for i in items
    ])

    html = f"""
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#f7f7f7;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#4f46e5;color:white;padding:16px 20px">
          <h1 style="margin:0;font-size:20px">¡Gracias por tu compra!</h1>
        </div>

        <div style="padding:20px">
          <p style="margin:0 0 8px">Hola {customer_name or 'Cliente'},</p>
          <p style="margin:0 0 16px">Recibimos tu pedido y ya lo estamos procesando.</p>

          <div style="margin:16px 0;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
            <div style="line-height:1.6">
                <div><strong>Pedido:</strong> #{order_id}</div>
                <div><strong>Fecha:</strong> {created_at_iso.split('T')[0]}</div>
                <div><strong>Email:</strong> {customer_email}</div>
            </div>
            <div style="margin-top:6px">
                <strong>Entrega/Retiro:</strong> {shipping_address_text or 'Datos no informados'}
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-top:8px">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Producto</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #e5e7eb">Cant.</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">Precio</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows_html}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:12px;text-align:right;font-weight:600">Total</td>
                <td style="padding:12px;text-align:right;font-weight:700">{format_currency_ars(total_amount)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="margin:16px 0 0;color:#555">Si tenés preguntas, respondé este email.</p>
          <p style="margin:4px 0 0;color:#555">¡Gracias por elegirnos!</p>
        </div>

        <div style="background:#f3f4f6;color:#6b7280;padding:12px 20px;font-size:12px">
          Zarpados Vapers — Este mensaje se envió automáticamente luego de tu compra.
        </div>
      </div>
    </div>
    """
    return html


def send_email_smtp(to_email, subject, html):
    import email.charset
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.header import Header
    from email.utils import formataddr

    host = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    port = int(os.getenv("MAIL_PORT", "587"))
    use_tls = str(os.getenv("MAIL_USE_TLS", "True")).lower() == "true"
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    default_sender = os.getenv("MAIL_DEFAULT_SENDER") or username

    if not (username and password):
        print("⚠️ Email no enviado: faltan MAIL_USERNAME/MAIL_PASSWORD")
        return False

    # 👇 Forzamos charset UTF-8 en todo el mensaje
    email.charset.add_charset('utf-8', email.charset.SHORTEST, None, 'utf-8')

    msg = MIMEMultipart("alternative")
    msg.set_charset("utf-8")

    # Cabeceras en UTF-8
    msg["Subject"] = str(Header(subject, "utf-8"))
    msg["From"] = str(Header(default_sender, "utf-8"))
    msg["To"] = str(Header(to_email, "utf-8"))

    # Cuerpo HTML en UTF-8
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        server = smtplib.SMTP(host, port)
        if use_tls:
            server.starttls()
        server.login(username, password)
        # 🔥 CAMBIO: usar as_bytes().decode('utf-8') en lugar de as_string()
        server.sendmail(default_sender, [to_email], msg.as_bytes())
        server.quit()
        print(f"✅ Email enviado a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email a {to_email}: {e}")
        return False

mercadopago_bp = Blueprint('mercadopago', __name__)



# =========================================================
#  CREDENCIALES MP POR ENTORNO (cambiar SOLO APP_ENV en deploy)
# =========================================================
def get_mp_creds():
    """
    DEV/Testing -> usa TEST
    PROD -> usa PROD
    Elegimos en base a APP_ENV (o FLASK_ENV si no está APP_ENV).
    Cambiá APP_ENV=production al desplegar y listo.
    """
    env = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()

    if env == "production":
        # 👇 Claves del CLIENTE en PRODUCCIÓN (configuradas en el servidor)
        access_token = os.getenv("MP_ACCESS_TOKEN_PROD")   # ej: APP_USR-xxxxxxxxx
        public_key   = os.getenv("MP_PUBLIC_KEY_PROD")     # ej: APP_USR-xxxxxxxxx
    else:
        # 👇 Claves de PRUEBA para desarrollo
        access_token = os.getenv("MP_ACCESS_TOKEN_TEST")   # ej: TEST-xxxxxxxxx
        public_key   = os.getenv("MP_PUBLIC_KEY_TEST")     # ej: TEST-xxxxxxxxx

    if not access_token:
        raise RuntimeError("Falta configurar Access Token de MP (MP_ACCESS_TOKEN_*).")

    return access_token, public_key


def get_mp_sdk():
    at, _ = get_mp_creds()
    return mercadopago.SDK(at)


# =========================================================
#  CREAR PREFERENCIA
# =========================================================
# =========================================================

@mercadopago_bp.route('/create-preference', methods=['POST'])
def create_preference():
    """Crear preferencia de pago en MercadoPago (JWT opcional) con sabor elegido"""
    try:
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        data = request.get_json() or {}
        print("=== INICIO CREATE PREFERENCE ===")
        print(f"User ID: {user_id}")
        print(f"Request data: {data}")

        if not data.get('items'):
            return jsonify({'error': 'Items requeridos'}), 400
        if not (data.get('payer') and data['payer'].get('email')):
            return jsonify({'error': 'Email del payer es requerido'}), 400

        # Normalizar items
        items = []
        flavors_meta = []   # 👈 guardaremos acá los sabores para metadata
        for it in data['items']:
            qty = int(it.get('quantity', 1) or 1)
            price = float(it.get('unit_price', 0) or 0)
            if price <= 0:
                return jsonify({'error': 'unit_price debe ser > 0'}), 400

            items.append({
                "id": str(it.get("id") or "item"),
                "title": str(it["title"]),
                "quantity": qty,
                "unit_price": price,
                "currency_id": "ARS",
            })

            if it.get("selected_flavor"):
                flavors_meta.append({
                    "product_id": str(it.get("id")),
                    "flavor": it["selected_flavor"]
                })

        frontend_url   = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        backend_public = os.getenv('BACKEND_PUBLIC_URL', '').rstrip('/')
        is_local = ("localhost" in frontend_url) or ("127.0.0.1" in frontend_url)

        payer_in = data.get('payer', {}) or {}
        payer_out = {"email": payer_in.get("email")}
        if payer_in.get("name"): payer_out["name"] = payer_in["name"]
        if payer_in.get("surname"): payer_out["surname"] = payer_in["surname"]
        if payer_in.get("identification"):
            pid = payer_in["identification"]
            if pid.get("type") and pid.get("number"):
                payer_out["identification"] = {"type": pid["type"], "number": str(pid["number"])}
        if payer_in.get("phone"):
            pp = payer_in["phone"]
            payer_out["phone"] = {"area_code": str(pp.get("area_code", "")), "number": str(pp.get("number", ""))}
        if payer_in.get("address"):
            pa = payer_in["address"]
            payer_out["address"] = {"street_name": str(pa.get("street_name", "")), "zip_code": str(pa.get("zip_code", ""))}

        form_email = (data.get('form_email') or payer_out.get("email") or "").strip().lower()
        ext_ref = str(user_id or int(datetime.utcnow().timestamp()))

        # ✅ Guardamos sabores en metadata["flavors"]
        preference_data = {
            "items": items,
            "payer": payer_out,
            "binary_mode": True,
            "external_reference": ext_ref,
            "additional_info": {
                "items": items,   # sin sabores, MP los borra igual
                "form_email": form_email,
                "name": payer_in.get("name", ""),
                "surname": payer_in.get("surname", "")
            },
            "metadata": {
                "form_email": form_email,
                "name": payer_in.get("name", ""),
                "surname": payer_in.get("surname", ""),
                "flavors": flavors_meta   # 👈 acá van los sabores
            },
            "back_urls": {
                "success": f"{frontend_url}/thank-you?status=approved",
                "failure": f"{frontend_url}/thank-you?status=failure",
                "pending": f"{frontend_url}/thank-you?status=pending",
            }
        }

        if not is_local:
            preference_data["auto_return"] = "approved"
        if backend_public:
            preference_data["notification_url"] = f"{backend_public}/api/mercadopago/webhook"

        sdk = get_mp_sdk()
        pref = sdk.preference().create(preference_data)
        if pref.get("status") == 201:
            return jsonify({
                'preference_id': pref['response']['id'],
                'init_point': pref['response']['init_point'],
                'sandbox_init_point': pref['response'].get('sandbox_init_point')
            }), 201

        return jsonify({'error': 'Error creando preferencia en MercadoPago'}), 400

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500



# =========================================================
#  WEBHOOK
# =========================================================
@mercadopago_bp.route('/webhook', methods=['POST', 'GET'])
def webhook():
    """Webhook para notificaciones de MercadoPago"""
    try:
        # MP puede enviar data por query params o JSON body
        data = request.get_json() or {}
        payment_id = data.get('data', {}).get('id') or request.args.get('data.id') or request.args.get('id')
        notification_type = data.get('type') or request.args.get('type') or request.args.get('topic')
        
        print(f"📥 WEBHOOK RECIBIDO")
        print(f"   Query params: {dict(request.args)}")
        print(f"   Payment ID: {payment_id}")
        print(f"   Type: {notification_type}")

        # Solo procesar tipo 'payment'
        if notification_type == 'payment' and payment_id:
            print(f"💳 Consultando pago {payment_id}...")
            
            sdk = get_mp_sdk()
            payment_response = sdk.payment().get(payment_id)
            
            if payment_response.get("status") == 200:
                payment = payment_response.get("response")
                print(f"✅ Pago obtenido: Status={payment.get('status')}")
                
                if payment.get('status') == 'approved':
                    # 🔥 SOLUCIÓN: Ejecutar en background sin app_context
                    create_order_from_payment(payment)
            else:
                print(f"❌ Error consultando pago: {payment_response}")
        else:
            print(f"⚠️ Webhook ignorado (type={notification_type})")

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        import traceback
        print(f"💥 ERROR EN WEBHOOK: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@mercadopago_bp.route('/auto-login/<payment_id>', methods=['POST'])
def auto_login_by_payment(payment_id):
    try:
        from flask_jwt_extended import create_access_token
        from datetime import timedelta

        print(f"🔐 Intentando auto-login para payment_id: {payment_id}")

        # Buscar por payment_id o fallback external_reference
        order = Order.query.filter_by(payment_id=str(payment_id)).first()
        if not order:
            order = Order.query.filter_by(external_reference=str(payment_id)).first()

        if not order:
            print(f"❌ Orden no encontrada para payment_id o external_ref={payment_id}")
            return jsonify({'error': 'Orden no encontrada'}), 404

        if not order.user_id:
            print(f"❌ Orden {order.id} sin user_id")
            return jsonify({'error': 'Usuario no asociado'}), 404

        token = create_access_token(
            identity=str(order.user_id),
            expires_delta=timedelta(hours=1)
        )

        user = User.query.get(order.user_id)

        print(f"✅ Token generado para usuario {user.id} ({user.email})")

        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 200

    except Exception as e:
        import traceback
        print(f"💥 Error en auto_login: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

#ACA EMPIEZO

def create_order_from_payment(payment_data):
    """
    Crear orden + items, descontar stock (general y por sabor) y enviar email.
    Maneja múltiples sabores para un mismo producto.
    """
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import create_engine
    from sqlalchemy.exc import IntegrityError
    import json
    from sqlalchemy.orm.attributes import flag_modified

    print("=== [DEBUG] INICIO create_order_from_payment ===")
    print("Payment data recibido:", payment_data)

    engine = create_engine(os.getenv('SQLALCHEMY_DATABASE_URI'))
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        pid = str(payment_data.get('id'))
        print(f"[DEBUG] Payment ID: {pid}, Status: {payment_data.get('status')}")

        if payment_data.get('status') != 'approved':
            print("[DEBUG] Pago no aprobado, se ignora.")
            return

        if session.query(Order.id).filter_by(payment_id=pid).first():
            print(f"⚠️ Orden ya creada para payment_id={pid}, se ignora.")
            return

        payer = payment_data.get('payer', {}) or {}
        mp_email = (payer.get('email') or '').strip().lower()
        meta = payment_data.get('metadata') or {}
        addi = payment_data.get('additional_info') or {}

        print("[DEBUG] Metadata:", meta)
        print("[DEBUG] Additional_info:", addi)

        # ✅ Lista de sabores en orden (no dict, para que no se pisen)
        flavors_list = [f.get("flavor") for f in meta.get("flavors", [])]
        print("[DEBUG] flavors_list:", flavors_list)

        # Datos comprador
        first_name = meta.get('name') or addi.get('name') or payer.get('first_name') or ''
        last_name  = meta.get('surname') or addi.get('surname') or payer.get('last_name') or ''
        full_name  = f"{first_name} {last_name}".strip() or 'Cliente'

        mp_address = (payer.get('address') or {}).get('street_name', 'Retiro en tienda')
        form_email = (meta.get('form_email') or addi.get('form_email') or '').strip().lower()
        ext_ref = (payment_data.get('external_reference') or '').strip()

        # Usuario
        user = None
        email_to_use = form_email or mp_email
        if ext_ref.isdigit():
            user = session.query(User).get(int(ext_ref))
        if not user and email_to_use:
            user = session.query(User).filter_by(email=email_to_use).first()
        if not user and email_to_use:
            from werkzeug.security import generate_password_hash
            print(f"[DEBUG] Creando usuario nuevo con email={email_to_use}")
            user = User(
                email=email_to_use,
                password=generate_password_hash('temp123'),
                name=full_name,
                shipping_address={"address": mp_address},
                is_active=True,
                must_reset_password=True
            )
            session.add(user)
            session.flush()

        # Orden
        order = Order(
            user_id=user.id if user else None,
            total_amount=float(payment_data.get('transaction_amount', 0)),
            status='pagado',
            payment_method='mercadopago',
            payment_id=pid,
            external_reference=ext_ref,
            customer_email=email_to_use,
            customer_name=full_name,
            shipping_address=mp_address,
            created_at=datetime.utcnow()
        )
        session.add(order)
        session.flush()
        print(f"[DEBUG] Orden creada con ID={order.id}")

        raw_items = (payment_data.get("additional_info") or {}).get("items") or []
        print("[DEBUG] raw_items recibidos:", raw_items)

        items_for_email = []
        for idx, it in enumerate(raw_items):
            print("[DEBUG] Procesando item:", it)
            if not str(it.get("id", "")).isdigit():
                continue

            prod_id = str(it["id"])
            qty = int(it.get("quantity", 1))
            price = float(it.get("unit_price", 0))
            subtotal = qty * price

            # ✅ Tomar sabor según posición si no viene en el item
            selected_flavor = it.get("selected_flavor") or (flavors_list[idx] if idx < len(flavors_list) else None)
            print(f"[DEBUG] Item prod_id={prod_id}, qty={qty}, flavor={selected_flavor}")

            session.add(OrderItem(
                order_id=order.id,
                product_id=int(prod_id),
                quantity=qty,
                price=price,
                selected_flavor=selected_flavor
            ))

            product = session.query(Product).get(int(prod_id))
            if product:
                old_stock = product.stock or 0
                product.stock = max(0, old_stock - qty)
                print(f"[DEBUG] Stock general prod {prod_id}: {old_stock} -> {product.stock}")

                if selected_flavor and product.flavor_catalog:
                    catalog = json.loads(json.dumps(product.flavor_catalog or []))
                    for flavor in catalog:
                        if flavor.get("name") == selected_flavor:
                            old_fstock = flavor.get("stock") or 0
                            flavor["stock"] = max(0, old_fstock - qty)
                            print(f"[DEBUG] Stock sabor '{selected_flavor}': {old_fstock} -> {flavor['stock']}")
                            break
                    product.flavor_catalog = catalog
                    flag_modified(product, "flavor_catalog")
                    session.add(product)

            title = it.get("title", f"Producto {prod_id}")
            if selected_flavor:
                title += f" ({selected_flavor})"
            items_for_email.append({
                "title": title,
                "quantity": qty,
                "unit_price": price,
                "subtotal": subtotal
            })

        try:
            session.commit()
            print(f"[DEBUG] Commit OK para order_id={order.id}")
        except IntegrityError:
            session.rollback()
            print(f"⚠️ Pedido duplicado detectado en commit (payment_id={pid}), ignorando.")
            return

        # Email
        try:
            html = build_order_email_html(
                order_id=order.id,
                customer_name=full_name,
                customer_email=email_to_use,
                items=items_for_email,
                total_amount=order.total_amount,
                created_at_iso=order.created_at.isoformat(),
                shipping_address_text=order.shipping_address
            )
            send_email_smtp(
                email_to_use,
                f"Zarpados Vapers - Confirmación de compra #{order.id}",
                html
            )
            print("[DEBUG] Email enviado OK")
        except Exception as e:
            print(f"⚠️ No se pudo enviar email: {e}")

    except Exception as e:
        session.rollback()
        print(f"💥 Error en create_order_from_payment: {e}")
    finally:
        session.close()
        print("=== [DEBUG] FIN create_order_from_payment ===")


# =========================================================
#  CONSULTAR UN PAGO
# =========================================================
@mercadopago_bp.route('/payment/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Obtener información de un pago específico"""
    try:
        sdk = get_mp_sdk()
        payment_response = sdk.payment().get(payment_id)

        if payment_response.get("status") == 200:
            return jsonify(payment_response["response"]), 200
        else:
            return jsonify({'error': 'Pago no encontrado'}), 404

    except Exception as e:
        print(f"Error getting payment: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
