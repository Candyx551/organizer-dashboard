from flask import Flask, jsonify, request
from flask_cors import CORS
import spotipy
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
CORS(app)

CLIENT_ID = "526176a9b56b44c795e25429109c402e"
CLIENT_SECRET = "928557bd47cc4e37a4697e09d763d08f"
REDIRECT_URI = "http://127.0.0.1:5500/index.html"

sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope="user-read-currently-playing user-modify-playback-state user-read-playback-state",
    cache_path=".cache"
)

@app.route("/login")
def login():
    auth_url = sp_oauth.get_authorize_url()
    return jsonify({"auth_url": auth_url})

@app.route("/exchange-code")
def exchange_code():
    code = request.args.get("code")
    if code:
        try:
            # Versuche, den Code gegen ein Token zu tauschen
            token_info = sp_oauth.get_access_token(code, check_cache=False)
            if token_info:
                return jsonify({"success": True})
        except Exception as e:
            # Gibt den genauen Spotify-Fehler im Terminal aus, damit wir sehen, was hakt
            print("SPOTIFY AUTH FEHLER:", str(e))
            return jsonify({"success": False, "error": str(e)}), 400
    return jsonify({"success": False}), 400

@app.route("/currently-playing")
def currently_playing():
    token_info = sp_oauth.get_cached_token()
    if not token_info:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        sp = spotipy.Spotify(auth=token_info['access_token'])
        current = sp.current_playback()
        
        if not current or not current.get("item"):
            return jsonify({"is_playing": False})
            
        item = current["item"]
        return jsonify({
            "is_playing": current["is_playing"],
            "name": item["name"],
            "artists": [artist["name"] for artist in item["artists"]],
            "album_image": item["album"]["images"][0]["url"] if item["album"]["images"] else ""
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/control/<action>", methods=["POST"])
def control(action):
    token_info = sp_oauth.get_cached_token()
    if not token_info:
        return jsonify({"error": "Not authenticated"}), 401
        
    try:
        sp = spotipy.Spotify(auth=token_info['access_token'])
        if action == "play":
            sp.start_playback()
        elif action == "pause":
            sp.pause_playback()
        elif action == "next":
            sp.next_track()
        elif action == "previous":
            sp.previous_track()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5000)