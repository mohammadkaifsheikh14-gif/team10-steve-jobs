# Team #10 — Steve Jobs Food Stall

Modern Flask + SQLite review website for G H Raisoni Skill Tech University.

## Included
- Real uploaded product photos for Cheesy Nuggets, Loaded Nachos and Guava Shots.
- Red / white / black premium UI.
- 3D-style hero product stage with floating real-food photography.
- Product cards, review system, live statistics and review wall.
- Meme generator.
- Snack Smash mini-game with server-side 1-in-100 discount draw.
- Admin dashboard for reviews and game stats.

## Product photos
The supplied photos are stored as:
- `static/images/cheesy-nuggets.webp`
- `static/images/loaded-nachos.webp`
- `static/images/guava-shots.webp`

## Run on Windows
```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe app.py
```
Open http://127.0.0.1:5000

Admin: http://127.0.0.1:5000/admin
Starter password: `stevejobs10`
