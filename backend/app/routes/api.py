from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

api = Blueprint('api', __name__)

@api.route("/me/address", methods=["PUT"])
@jwt_required()
def update_user_address():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "not found"}), 404

    data = request.get_json() or {}
    addr_type = data.get("type")
    payload = data.get("payload")

    if addr_type not in ("facturación", "envío"):
        return jsonify({"error": "tipo inválido"}), 400

    if payload.get("dni"):
        user.dni = payload["dni"]

    if addr_type == "facturación":
        user.billing_address = payload
    else:
        user.shipping_address = payload

    db.session.commit()
    return jsonify({"ok": True})

@api.route("/me/address", methods=["GET"])
@jwt_required()
def get_user_addresses():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "not found"}), 404
    return jsonify({
        "billing_address": user.billing_address or {},
        "shipping_address": user.shipping_address or {},
        "dni": user.dni or ""
    })