from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import secrets
from functools import wraps
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "team10-change-this-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///reviews.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "stevejobs10")
PRODUCTS = {"Cheesy Nuggets", "Loaded Nachos", "Guava Shots"}
GAME_WIN_CHANCE = 0.01  # 1% server-side chance

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    contact = db.Column(db.String(120), nullable=True)
    product = db.Column(db.String(40), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class GamePlay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    play_key = db.Column(db.String(64), nullable=False, unique=True)
    won = db.Column(db.Boolean, default=False, nullable=False)
    discount_code = db.Column(db.String(32), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

def admin_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return fn(*args, **kwargs)
    return wrapped

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/reviews")
def get_reviews():
    rows = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([{
        "id": r.id, "name": r.name, "contact": r.contact or "",
        "product": r.product, "rating": r.rating, "comment": r.comment,
        "created_at": r.created_at.strftime("%d %b %Y • %I:%M %p")
    } for r in rows])

@app.get("/api/statistics")
def statistics():
    rows = Review.query.all()
    total = len(rows)
    average = round(sum(r.rating for r in rows) / total, 1) if total else 0
    distribution = {str(i): sum(1 for r in rows if r.rating == i) for i in range(1,6)}
    products = {}
    for product in PRODUCTS:
        pr = [r for r in rows if r.product == product]
        products[product] = {
            "count": len(pr),
            "average": round(sum(r.rating for r in pr)/len(pr),1) if pr else 0
        }
    return jsonify({"total": total, "average": average, "distribution": distribution, "products": products})

@app.post("/api/reviews")
def create_review():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name","")).strip()
    contact = str(data.get("contact","")).strip()
    product = str(data.get("product","")).strip()
    comment = str(data.get("comment","")).strip()
    try:
        rating = int(data.get("rating",0))
    except (TypeError, ValueError):
        rating = 0
    if not name or len(name) > 80: return jsonify(error="Please enter a valid name."), 400
    if product not in PRODUCTS: return jsonify(error="Please choose a product."), 400
    if rating not in range(1,6): return jsonify(error="Please choose a rating from 1 to 5."), 400
    if not comment or len(comment) > 500: return jsonify(error="Review must be between 1 and 500 characters."), 400
    db.session.add(Review(name=name, contact=contact[:120], product=product, rating=rating, comment=comment))
    db.session.commit()
    return jsonify(ok=True)

@app.post("/api/game/play")
def game_play():
    # One free attempt per browser session. The win decision happens on the server.
    if session.get("game_played"):
        return jsonify(ok=False, error="You already used your Team #10 game attempt on this browser. ❤️"), 429

    data = request.get_json(silent=True) or {}
    try:
        hits = int(data.get("hits", 0))
    except (TypeError, ValueError):
        hits = 0
    if hits < 5:
        return jsonify(ok=False, error="Complete the snack challenge first!"), 400

    won = secrets.randbelow(100) == 0  # exactly 1 winning number out of 100
    code = None
    if won:
        code = "SJ10-10OFF-" + secrets.token_hex(3).upper()

    play = GamePlay(play_key=secrets.token_hex(24), won=won, discount_code=code)
    db.session.add(play)
    db.session.commit()
    session["game_played"] = True
    return jsonify(ok=True, won=won, discount_code=code)

@app.get("/api/game/stats")
@admin_required
def game_stats():
    plays = GamePlay.query.order_by(GamePlay.created_at.desc()).all()
    return jsonify({
        "plays": len(plays),
        "wins": sum(1 for p in plays if p.won),
        "winners": [{"code": p.discount_code, "created_at": p.created_at.strftime("%d %b %Y • %I:%M %p")} for p in plays if p.won]
    })

@app.route("/admin", methods=["GET","POST"])
def admin_login():
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("dashboard"))
        return render_template("admin_login.html", error="Wrong password.")
    if session.get("admin"): return redirect(url_for("dashboard"))
    return render_template("admin_login.html")

@app.get("/admin/dashboard")
@admin_required
def dashboard():
    return render_template("admin.html")

@app.post("/admin/delete/<int:review_id>")
@admin_required
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if review:
        db.session.delete(review); db.session.commit()
    return jsonify(ok=True)

@app.get("/admin/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
