# app/api.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

api = Blueprint('api', __name__)

def _get_user_from_identity():
    ident = get_jwt_identity()
    try:
        ident = int(ident)  # tu token usa string del id
    except Exception:
        pass
    return db.session.get(User, ident)

@api.route("/me/address", methods=["PUT"])
@jwt_required()
def update_user_address():
    user = _get_user_from_identity()
    if not user:
        return jsonify({"error": "not found"}), 404

    data = request.get_json() or {}
    addr_type = (data.get("type") or "").lower()
    payload = data.get("payload") or {}

    if addr_type not in ("shipping", "billing"):
        return jsonify({"error": "tipo inválido"}), 400

    if payload.get("dni"):
        user.dni = payload["dni"]

    # ✅ acá estaba el desliz: usar "billing" en vez de "facturación"
    if addr_type == "billing":
        user.billing_address = payload
    else:
        user.shipping_address = payload

    db.session.commit()
    return jsonify({"ok": True}), 200

@api.route("/me/address", methods=["GET"])
@jwt_required()
def get_user_addresses():
    user = _get_user_from_identity()
    if not user:
        return jsonify({"error": "not found"}), 404

    return jsonify({
        "billing_address": user.billing_address or {},
        "shipping_address": user.shipping_address or {},
        "dni": user.dni or ""
    }), 200
