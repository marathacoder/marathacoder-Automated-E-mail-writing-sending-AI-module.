// Function to switch between content types (Email, Blog, Article)
function selectContentType(contentType) {
    // Hide all layouts initially
    const layouts = ["email-layout", "blog-layout", "article-layout"];
    layouts.forEach(layout => document.getElementById(layout).style.display = "none");

    // Show the selected content type layout and update the form title
    const formTitle = document.getElementById("form-title");
    const sendButton = document.getElementById("send-btn");

    if (contentType === "email") {
        document.getElementById("email-layout").style.display = "block";
        formTitle.textContent = "Email Content Generator";
        sendButton.style.display = "inline-block";  // Show send button for email
    } else if (contentType === "blog") {
        document.getElementById("blog-layout").style.display = "block";
        formTitle.textContent = "Blog Content Generator";
        sendButton.style.display = "none";  // Hide send button for blog
    } else if (contentType === "article") {
        document.getElementById("article-layout").style.display = "block";
        formTitle.textContent = "Article Content Generator";
        sendButton.style.display = "none";  // Hide send button for article
    }
}

// Function to generate content based on user input by sending data to the Flask server
function generateContent() {
    // Determine the active content layout and gather form data accordingly
    const emailLayoutVisible = document.getElementById("email-layout").style.display === "block";
    const blogLayoutVisible = document.getElementById("blog-layout").style.display === "block";
    const articleLayoutVisible = document.getElementById("article-layout").style.display === "block";

    let contentType, prompt, recipientEmail = null, senderName = null, senderPosition = null;

    // Gather user input based on the selected layout
    if (emailLayoutVisible) {
        contentType = "email";
        prompt = document.getElementById("email-prompt").value;
        recipientEmail = document.getElementById("email-recipient").value;
        senderName = document.getElementById("sender-name").value;
        senderPosition = document.getElementById("sender-position").value;
    } else if (blogLayoutVisible) {
        contentType = "blog";
        prompt = document.getElementById("blog-prompt").value;
    } else if (articleLayoutVisible) {
        contentType = "article";
        prompt = document.getElementById("article-prompt").value;
    }

    // Validate that a prompt has been entered
    if (!prompt) {
        alert("Please enter a prompt to generate content.");
        return;
    }

    // Create a payload with user data to send to the server
    const payload = {
        content_type: contentType,
        user_prompt: prompt,
        recipient_email: recipientEmail,
        sender_name: senderName,
        sender_position: senderPosition
    };

    // Send the payload to the Flask server using AJAX
    fetch('/generate_content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        // Display the generated content in the appropriate output field
        if (contentType === "email") {
            document.getElementById("email-message").value = `Subject: ${data.subject}\n\n${data.body}`;
        } else if (contentType === "blog") {
            document.getElementById("blog-content").value = data.body;
        } else if (contentType === "article") {
            document.getElementById("article-content").value = data.body;
        }
    })
    .catch(error => {
        console.error("Error generating content:", error);
        alert("An error occurred while generating content. Please try again.");
    });
}

// Function to simulate sending an email by opening the default email client
function sendEmail() {
    const recipientEmail = document.getElementById("email-recipient").value;
    const emailMessage = document.getElementById("email-message").value;

    // Check if recipient email and generated message are available before attempting to send
    if (recipientEmail && emailMessage) {
        const subject = "Generated Content";
        const body = encodeURIComponent(emailMessage);
        const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
    } else {
        alert("Please generate content and provide a recipient email before sending.");
    }
}

// Function to open the history modal and fetch data from the server
function viewHistory() {
    document.getElementById("history-popup").style.display = "block";
    fetchHistoryData();
}

// Fetch history data from the server
function fetchHistoryData() {
    fetch('/history')  // Ensure the endpoint is correct
        .then(response => {
            // Check if the response is successful
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const historyList = document.getElementById("history-list");
            historyList.innerHTML = ""; // Clear any previous data

            data.forEach(record => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>Content Type:</strong> ${record.content_type} <br>
                    <strong>User Prompt:</strong> ${record.user_prompt} <br>
                    <strong>Subject:</strong> ${record.generated_subject} <br>
                    <strong>Body:</strong> ${record.generated_body} <br>
                    <strong>Created At:</strong> ${record.created_at} <br>
                `;
                historyList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching history:', error);
            alert('An error occurred while fetching the history. Please try again.');
        });
}

// Function to close the history modal
function closeHistory() {
    document.getElementById("history-popup").style.display = "none";
}

// Function to redirect to the login page when "Get Started" button is clicked
document.getElementById('get-started-btn').addEventListener('click', function() {
    window.location.href = "index.html";  // Redirect to login page
});
