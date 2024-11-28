from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify
import mysql.connector
import cohere

# Initialize the Flask app and Cohere client
app = Flask(__name__)
app.secret_key = "your_secret_key"
co = cohere.Client('1x80ZH7kbo388pl1NneQIAIuIIWhXJb9s4QObRLn')

# Database connection function
def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="yash_kute",
        password="2003",
        database="Navkriti"
    )


# Registration function
def register_user(username, password, email):
    connection = connect_to_db()
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, email) VALUES (%s, %s, %s)", (username, password, email))
        connection.commit()
        return cursor.lastrowid  # Return the user ID of the new user
    except mysql.connector.IntegrityError:
        return None  # Return None if there is a duplicate entry error
    finally:
        cursor.close()
        connection.close()

# Login function
def login_user(username, password):
    connection = connect_to_db()
    cursor = connection.cursor()
    cursor.execute("SELECT user_id FROM users WHERE username = %s AND password = %s", (username, password))
    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return result[0] if result else None

@app.route('/')
def home():
    return render_template('front.html')

# Route for registration
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        user_id = register_user(username, password, email)
        if user_id:
            session['user_id'] = user_id  # Log the user in after registration
            flash("Registration successful!", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Username or email already exists.", "error")
            return redirect(url_for('register'))
    return render_template('index.html')

# Route for login
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    user_id = login_user(username, password)
    if user_id:
        session['user_id'] = user_id  # Store user_id in session
        flash("Login successful!", "success")
        return redirect(url_for('dashboard'))
    else:
        flash("Invalid username or password", "error")
        return redirect(url_for('show_login'))

# Route to render the login form
@app.route('/login')
def show_login():
    return render_template('index.html')

# Main dashboard route
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('show_login'))
    return render_template('dashboard/index2.html')

@app.route('/generate_content', methods=['POST'])
def generate_content():
    if 'user_id' not in session:
        return redirect(url_for('show_login'))

    data = request.json
    content_type = data['content_type']
    user_prompt = data['user_prompt']
    recipient_email = data.get('recipient_email')
    sender_name = data.get('sender_name')
    sender_position = data.get('sender_position')

    # Construct prompt for Cohere API
    prompt = f"""
### User Prompt: {user_prompt}
### Recipient Information:
- Email: {recipient_email}
### Sender Information:
- Name: {sender_name}
- Position: {sender_position}
### Auto-Generated Subject:
### Generated {content_type.capitalize()}:
    """
    
    # Generate content using Cohere
    response = co.generate(
        model='command-xlarge-nightly',
        prompt=prompt,
        max_tokens=600,
        temperature=0.7
    )

    content = response.generations[0].text.strip().split("\n", 1)
    subject = content[0].replace("Auto-Generated Subject:", "").strip()
    body = content[1].strip() if len(content) > 1 else ""
    
    # Save generated content to the database
    connection = connect_to_db()
    cursor = connection.cursor()
    cursor.execute(
        "INSERT INTO content_history (user_id, content_type, user_prompt, generated_subject, generated_body) "
        "VALUES (%s, %s, %s, %s, %s)",
        (session['user_id'], content_type, user_prompt, subject, body)
    )
    connection.commit()
    cursor.close()
    connection.close()

    # Return the generated content as a JSON response
    return jsonify({'subject': subject, 'body': body})


@app.route('/history')
def history():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401  # Return a 401 error if the user is not logged in

    # Fetch history data from the database
    connection = connect_to_db()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("""
        SELECT content_type, user_prompt, generated_subject, generated_body, created_at
        FROM content_history
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (session['user_id'],))
    history_data = cursor.fetchall()
    cursor.close()
    connection.close()

    # Return the fetched data as JSON
    return jsonify(history_data)


if __name__ == '__main__':
    app.run(debug=True)
