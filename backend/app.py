from flask import Flask, jsonify, request


app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "You have hit the API endpoint!"})

@app.route('/dashboard', methods=['GET'])
def dashboard():
    return jsonify({"message": "Welcome to the dashboard!"})

if __name__ == '__main__':
    app.run(debug=True)