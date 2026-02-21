document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatContainer = document.getElementById('chat-container');
    const emptyState = document.querySelector('.empty-state');
    const newChatBtn = document.getElementById('new-chat-btn');
    const suggestions = document.querySelectorAll('.suggestion-chip');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const attachmentsArea = document.getElementById('attachments-area');
    const attachmentsList = document.getElementById('attachments-list');

    // State
    let isWaiting = false;
    let uploadedFiles = [];
    let generatedFiles = [];
    const sessionId = 'session_' + Date.now();

    // 1. Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        sendBtn.disabled = this.value.trim() === '';
    });

    // 2. Handle Send
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
            chatInput.dispatchEvent(new Event('input'));
            handleSend();
        });
    });

    // 4. New Chat
    newChatBtn.addEventListener('click', async () => {
        try {
            await fetch(`http://127.0.0.1:8000/chat/history/${sessionId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error clearing history:', error);
        }

        chatContainer.innerHTML = '';
        chatContainer.appendChild(emptyState);
        emptyState.classList.remove('hidden');
        uploadedFiles = [];
        generatedFiles = [];
        updateAttachmentsUI();
    });

    // 5. File Upload
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            if (file.size > 25 * 1024 * 1024) {
                alert(`File "${file.name}" is too large. Maximum size is 25MB.`);
                continue;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', sessionId);

            try {
                const response = await fetch('http://127.0.0.1:8000/upload-file', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: 'uploaded'
                    });
                    updateAttachmentsUI();
                } else {
                    alert(`Failed to upload ${file.name}: ${result.detail}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert(`Failed to upload ${file.name}`);
            }
        }

        fileInput.value = '';
    });

    function updateAttachmentsUI() {
        const allFiles = [...uploadedFiles, ...generatedFiles];
        
        if (allFiles.length === 0) {
            attachmentsArea.style.display = 'none';
            attachmentsList.innerHTML = '';
            return;
        }

        attachmentsArea.style.display = 'block';
        attachmentsList.innerHTML = '';

        allFiles.forEach((file, index) => {
            const chip = document.createElement('div');
            chip.className = 'attachment-chip';
            
            // Different styling for generated files
            if (file.type === 'generated') {
                chip.classList.add('generated');
            }
            
            const sizeStr = formatFileSize(file.size);
            const icon = getFileIcon(file.name);
            
            chip.innerHTML = `
                ${icon}
                <span class="attachment-name">${file.name}</span>
                ${file.type === 'generated' ? '<span class="generated-badge">AI Created</span>' : ''}
                <span class="attachment-size">${sizeStr}</span>
                <button class="remove-attachment" data-index="${index}" data-type="${file.type}" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;

            attachmentsList.appendChild(chip);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-attachment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const type = e.currentTarget.dataset.type;
                
                const fileList = type === 'uploaded' ? uploadedFiles : generatedFiles;
                const filename = fileList.find((_, i) => i === index)?.name;

                if (filename) {
                    try {
                        await fetch(`http://127.0.0.1:8000/delete-file?filename=${encodeURIComponent(filename)}&session_id=${sessionId}&file_type=${type}`, {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.error('Error deleting file:', error);
                    }
                }

                if (type === 'uploaded') {
                    uploadedFiles.splice(uploadedFiles.findIndex(f => f.name === filename), 1);
                } else {
                    generatedFiles.splice(generatedFiles.findIndex(f => f.name === filename), 1);
                }
                
                updateAttachmentsUI();
            });
        });
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        if (['doc', 'docx'].includes(ext)) {
            return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        } else if (ext === 'pdf') {
            return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
        } else if (['xls', 'xlsx'].includes(ext)) {
            return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>';
        } else {
            return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
        }
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Core Logic
    function handleSend() {
        const text = chatInput.value.trim();
        if (!text || isWaiting) return;

        emptyState.classList.add('hidden');
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        appendMessage(text, 'user', uploadedFiles.length > 0 || generatedFiles.length > 0);

        const loadingId = showLoading();
        isWaiting = true;

        sendMessageToBackend(text)
            .then(data => {
                removeLoading(loadingId);
                
                const isEmailAction = data.response.toLowerCase().includes('email sent') ||
                    text.toLowerCase().includes('send') ||
                    data.response.includes('✅');

                appendMessage(data.response, 'ai', isEmailAction);

                // Update generated files if any were created
                if (data.generated_files && data.generated_files.length > 0) {
                    data.generated_files.forEach(filename => {
                        if (!generatedFiles.find(f => f.name === filename)) {
                            generatedFiles.push({
                                name: filename,
                                size: 0, // Size unknown for generated files
                                type: 'generated'
                            });
                        }
                    });
                    updateAttachmentsUI();
                }

                // Clear all files after successful send
                if (isEmailAction && data.response.includes('✅')) {
                    uploadedFiles = [];
                    generatedFiles = [];
                    updateAttachmentsUI();
                }
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

        let attachmentsHtml = '';
        if (type === 'user' && isEmailMode) {
            const totalFiles = uploadedFiles.length + generatedFiles.length;
            if (totalFiles > 0) {
                attachmentsHtml = `
                    <div class="message-attachments">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        ${totalFiles} file${totalFiles > 1 ? 's' : ''} attached
                    </div>`;
            }
        }

        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');

        const formattedText = text.replace(/\n/g, '<br>');

        bubble.innerHTML = `
            ${badgeHtml}
            <div class="message-content">${formattedText}</div>
            ${attachmentsHtml}
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
        const endpoint = await determineEndpoint(userMessage);
        const url = `http://127.0.0.1:8000${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: userMessage,
                    session_id: sessionId 
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function determineEndpoint(message) {
        const msg = message.toLowerCase();
        
        // Quick keyword pre-check as primary method
        const employeeKeywords = [
            "add employee", "add a employee", "add new employee", "adding employee",
            "store employee", "store a employee", "storing employee",
            "insert employee", "inserting employee",
            "update employee", "updating employee",
            "delete employee", "deleting employee", "remove employee",
            "list employees", "show employees", "search employee", "find employee",
            "employee database", "employee data",
            "who is", "who are",
            "job role", "phone number", "email id",
            // Common typos/variations
            "ad a employee", "ad employee", "adding a employee",
        ];
        
        for (const keyword of employeeKeywords) {
            if (msg.includes(keyword)) {
                return "/chat/employee";
            }
        }
        
        // Check for email-related keywords
        const emailKeywords = [
            "send email", "send mail", "send an email",
            "compose email", "write email", "email to",
        ];
        
        for (const keyword of emailKeywords) {
            if (msg.includes(keyword)) {
                return "/chat/email";
            }
        }
        
        // Fallback to LLM routing
        try {
            const response = await fetch("http://127.0.0.1:8000/chat/route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();
            return data.endpoint;
        } catch (error) {
            console.error("Routing error, defaulting to email:", error);
            return "/chat/email";
        }
    }
});
