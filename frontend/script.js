document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatContainer = document.getElementById('chat-container');
    const emptyState = document.querySelector('.empty-state');
    const newChatBtn = document.getElementById('new-chat-btn');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    // State
    let isWaiting = false;

    // 1. Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset
        this.style.height = Math.min(this.scrollHeight, 120) + 'px'; // Max 120px

        // Toggle Send Button
        sendBtn.disabled = this.value.trim() === '';
    });

    // 2. Handle Send (Click & Enter)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    // 3. Suggestion Chips
    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.textContent;
            chatInput.dispatchEvent(new Event('input')); // Trigger resize/enable
            handleSend();
        });
    });

    // 4. New Chat
    newChatBtn.addEventListener('click', () => {
        chatContainer.innerHTML = '';
        chatContainer.appendChild(emptyState);
        emptyState.classList.remove('hidden');
    });

    // --- Core Logic ---

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text || isWaiting) return;

        // UI Reset
        emptyState.classList.add('hidden');
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        // 1. Add User Message
        appendMessage(text, 'user');

        // 2. Add Loading Indicator
        const loadingId = showLoading();
        isWaiting = true;

        // 3. Backend Call
        sendMessageToBackend(text)
            .then(response => {
                removeLoading(loadingId);
                // Check if it's an email confirmation
                const isEmailAction = response.toLowerCase().includes('email sent') ||
                    text.toLowerCase().includes('send an email');

                appendMessage(response, 'ai', isEmailAction);
            })
            .catch(err => {
                removeLoading(loadingId);
                appendMessage("Sorry, I encountered an error connecting to the server.", 'ai');
                console.error(err);
            })
            .finally(() => {
                isWaiting = false;
                chatInput.focus();
            });
    }

    function appendMessage(text, type, isEmailMode = false) {
        const row = document.createElement('div');
        row.classList.add('message-row', type);

        // Optional Email Badge for AI
        let badgeHtml = '';
        if (type === 'ai' && isEmailMode) {
            badgeHtml = `
                <div class="email-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Email Mode Activated
                </div>`;
        }

        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');

        // Format text (simple replacement for newlines)
        const formattedText = text.replace(/\n/g, '<br>');

        bubble.innerHTML = `
            ${badgeHtml}
            <div class="message-content">${formattedText}</div>
            <div class="timestamp">${getCurrentTime()}</div>
        `;

        row.appendChild(bubble);
        chatContainer.appendChild(row);
        scrollToBottom();
    }

    function showLoading() {
        const id = 'loading-' + Date.now();
        const row = document.createElement('div');
        row.classList.add('message-row', 'ai');
        row.id = id;
        row.innerHTML = `
            <div class="typing-bubble">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        chatContainer.appendChild(row);
        scrollToBottom();
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async function sendMessageToBackend(userMessage) {
        // Construct agent prompt if needed, or pass raw if Agent handles it
        // The previous step showed we were constructing prompts. 
        // We will pass the user message raw, assuming the Agent (DebAI) is smart enough
        // OR we can softly wrap it if the user didn't be specific.
        // For a chatbot feel, raw is usually better.

        try {
            const response = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            throw error;
        }
    }
});
