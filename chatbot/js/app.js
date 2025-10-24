const baseUrl = 'https://tvtorbackend.onrender.com/api/v1';
let userData = {};
let isAssignTutor = true;
let isAssignTutor_check = true;
let setIntervalTime;
let count = 3;
let notificationId = "";
let isFetching = false;
let currentQuestionId = null;
let lastQuestionTitle = null;
let currentLang = 'it';
let notificationSent = false;
let questionsCompleted = false;
let selectedSubjects = []; // Array per tracciare materie selezionate

const messages = {
    it: {
        welcome: "Ciao! 👋 In meno di 1 minuto troviamo un tutor giusto per Te gratuitamente. 🎓 Rispondi a 3 semplici domande e riceverai il contatto del tutor. 👇",
        processing: "Grazie! Stiamo cercando il miglior tutor per te. Attendi per favore...",
        noTutor: "Non ci sono tutor disponibili al momento. Scrivici al +39 3485804824!",
        phoneQuestion: "📞 Inserisci il tuo numero di telefono per essere contattato dal tutor 🤝\n" +
                       "🔒 Il numero verrà inviato all'insegnante e poi cancellato automaticamente ✅",
        contactMessage: "Ora puoi contattare il tutor al numero {phone}. Buona lezione!",
        conversationEnded: "Conversazione terminata",
        selectUpTo2: "Seleziona fino a 2 materie",
        selectOption: "seleziona un'opzione",
        typeHere: "digita qui",
        send: "Invia",
        selected: "Selezionato",
        of: "di",
        maxSubjectsError: "Puoi selezionare massimo 2 materie!",
        selectAtLeastOne: "Seleziona almeno una materia"
    },
    en: {
        welcome: "Hi! 👋 In less than a minute, we'll find the right tutor for you for free. 🎓 Answer 3 simple questions and you'll receive the tutor's contact. 👇",
        processing: "Thank you! We're finding the best tutor for you. Please wait...",
        noTutor: "No tutors are available right now. Contact us at +393485804824!",
        phoneQuestion: "📞 Enter your phone number to be contacted by the tutor 🤝\n" +
                       "🔒 The number will be sent to the teacher and then automatically deleted ✅",
        contactMessage: "You can now contact the tutor at the number {phone}. Have a nice lesson!",
        conversationEnded: "Conversation ended",
        selectUpTo2: "Select up to 2 subjects",
        selectOption: "Select an option",
        typeHere: "Type here",
        send: "Send",
        selected: "Selected",
        of: "of",
        maxSubjectsError: "You can select up to 2 subjects only!",
        selectAtLeastOne: "Select at least one subject"
    }
};

function getLangText(key) {
    return messages[currentLang][key] || key;
}

function scrollToBottom() {
    const c = document.getElementById('messagesContainer');
    c.scrollTop = c.scrollHeight;
}

function addMessage(text, type = 'bot', isHTML = false) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    if (isHTML) bubbleDiv.innerHTML = text;
    else bubbleDiv.textContent = text;

    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function addBotMessage(text) {
    return addMessage(text, 'bot', false);
}

function addUserMessage(text) {
    return addMessage(text, 'user', false);
}

function addTypingIndicator() {
    removeTypingIndicator();
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot typing';
    messageDiv.id = 'typingIndicator';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const n = document.getElementById('typingIndicator');
    if (n) n.remove();
}

function removeTypingAndLoading() {
    removeTypingIndicator();
    document.querySelectorAll('#messagesContainer .message').forEach(n => {
        const txt = (n.textContent || '').trim();
        if (n.classList.contains('typing') || n.classList.contains('loading') || txt === '...') {
            n.remove();
        }
    });
}

function disableInput() {
    const input = document.getElementById('userInput');
    const btn = document.getElementById('sendButton');
    input.disabled = true;
    btn.disabled = true;
}

function enableSendButton() {
    const btn = document.getElementById('sendButton');
    btn.disabled = false;
}

function disableSendButton() {
    const btn = document.getElementById('sendButton');
    btn.disabled = true;
}

function showSubjectCounter() {
    let counter = document.getElementById('subjectCounter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'subjectCounter';
        counter.className = 'subject-counter';
        document.getElementById('messagesContainer').appendChild(counter);
    }
    const count = selectedSubjects.length;
    counter.textContent = `${getLangText('selected')} ${count} ${getLangText('of')} 2`;
    scrollToBottom();
}

function showErrorMessage(message) {
    let errorMsg = document.getElementById('errorMessage');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'errorMessage';
        errorMsg.className = 'error-message';
        document.getElementById('messagesContainer').appendChild(errorMsg);
    }
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';

    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 3000);

    scrollToBottom();
}

function enableTextInput(questionName) {
    lastQuestionTitle = questionName || lastQuestionTitle;

    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    userInput.disabled = false;
    sendButton.disabled = false;
    setTimeout(() => userInput.focus(), 50);

    if (questionName === 'age') {
        userInput.placeholder = currentLang === 'it' ? 'digita qui' : 'Type here';
    } else if (questionName === 'phone_number') {
        userInput.placeholder = currentLang === 'it' ? 'Inserisci il tuo numero' : 'Enter your phone number';
    } else {
        userInput.placeholder = '...';
    }
}

function enableInputFor(q) {
    if (q.type === 'text') enableTextInput(q.title || '');
    else disableInput();
}

function applyPlaceholderHints(qData) {
    const q = qData[0];
    const input = document.getElementById('userInput');
    if (q.type === 'select') {
        if (q.title === 'subject') {
            input.placeholder = currentLang === 'it' ? 'Seleziona almeno una materia' : 'Select at least one subject';
        } else {
            input.placeholder = currentLang === 'it' ? "seleziona un'opzione" : 'Select an option';
        }
    } else {
        if (q.title === 'age') {
            input.placeholder = currentLang === 'it' ? 'digita qui' : 'Type here';
        } else {
            input.placeholder = '...';
        }
    }
}

function addOptions(options, {multiple = false, name = ''} = {}) {
    document.getElementById('currentOptions')?.remove();
    document.getElementById('subjectCounter')?.remove();
    selectedSubjects = []; // Reset

    const wrap = document.createElement('div');
    wrap.id = 'currentOptions';
    wrap.className = 'options-container';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-button';
        btn.textContent = opt.text || opt.label || opt;
        btn.dataset.value = opt.value || opt.text || opt;

        if (!multiple) {
            // Selezione singola (location)
            btn.addEventListener('click', async () => {
                if (isFetching) return;
                addUserMessage(btn.textContent);
                userData[name] = btn.dataset.value;
                wrap.remove();

                if (userData.age && userData.subject && userData.location) {
                    startTutorSearch();
                    return;
                }
                await fetchNextQuestion();
            }, {once: true});
        } else {
            // Selezione multipla (subject) - max 2
            btn.addEventListener('click', () => {
                if (btn.classList.contains('selected')) {
                    // Deseleziona
                    btn.classList.remove('selected');
                    const index = selectedSubjects.indexOf(btn.dataset.value);
                    if (index > -1) selectedSubjects.splice(index, 1);
                } else {
                    // Seleziona
                    if (selectedSubjects.length >= 2) {
                        showErrorMessage(getLangText('maxSubjectsError'));
                        return;
                    }
                    btn.classList.add('selected');
                    selectedSubjects.push(btn.dataset.value);
                }

                showSubjectCounter();

                // Abilita/disabilita pulsante invia
                if (selectedSubjects.length > 0) {
                    enableSendButton();
                } else {
                    disableSendButton();
                }
            });
        }

        wrap.appendChild(btn);
    });

    document.getElementById('messagesContainer').appendChild(wrap);

    if (multiple) {
        showSubjectCounter();
        disableSendButton(); // Inizialmente disabilitato
    }

    scrollToBottom();
}

async function handleTextSubmit() {
    if (isFetching) return;

    // Gestione invio per subject selection
    if (lastQuestionTitle === 'subject' && selectedSubjects.length > 0) {
        if (selectedSubjects.length === 0) {
            showErrorMessage(getLangText('selectAtLeastOne'));
            return;
        }

        userData.subject = selectedSubjects;
        addUserMessage(selectedSubjects.map(s => {
            const btn = document.querySelector(`.option-button[data-value="${s}"]`);
            return btn ? btn.textContent : s;
        }).join(', '));

        document.getElementById('currentOptions')?.remove();
        document.getElementById('subjectCounter')?.remove();
        selectedSubjects = [];

        if (userData.age && userData.location) {
            startTutorSearch();
            return;
        }

        await fetchNextQuestion();
        return;
    }

    const input = document.getElementById('userInput');
    const val = (input.value || '').trim();
    if (!val) return;

    addUserMessage(val);

    if (lastQuestionTitle) {
        userData[lastQuestionTitle] = val;
    }

    if (lastQuestionTitle === 'phone_number') {
        sendToFormspree(userData, val);
        input.value = '';
        endConversationUI();
        return;
    }

    input.value = '';

    if (userData.age && userData.subject && userData.location) {
        startTutorSearch();
        return;
    }

    await fetchNextQuestion();
}

async function fetchNextQuestion() {
    if (questionsCompleted) {
        console.log('Questions already completed, skipping fetch');
        return;
    }

    if (isFetching) return;
    isFetching = true;
    disableInput();

    try {
        removeTypingAndLoading();
        document.getElementById('currentOptions')?.remove();
        document.getElementById('subjectCounter')?.remove();
        document.getElementById('errorMessage')?.remove();

        if (userData.age && userData.subject && !userData.email) {
            const n = Date.now();
            userData.email = `${n}student@gmail.com`;
        }

        if (userData.age && userData.subject && userData.location) {
            console.log('All data collected, starting tutor search directly');
            isFetching = false;
            startTutorSearch();
            return;
        }

        const payload = {
            language: currentLang,
            question: count,
            email: userData.email,
            subject: userData.subject,
            location: userData.location,
            mobilenumber: userData.mobilenumber,
            age: userData.age,
            website: userData.website,
            notificationId: notificationId
        };

        const res = await fetch(`${baseUrl}/question`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const result = await res.json();
        const qData = (result?.data?.data) || [];

        if (!qData.length) {
            enableTextInput();
            isFetching = false;
            return;
        }

        const qKey = `${qData[0].question_num}::${qData[0].title || ''}`;
        if (currentQuestionId === qKey) {
            enableInputFor(qData[0]);
            isFetching = false;
            return;
        }
        currentQuestionId = qKey;

        const titleLower = (qData[0].title || '').toLowerCase();
        if (['mobilenumber', 'phone_number', 'phone', 'telefono', 'numero'].some(k => titleLower.includes(k))) {
            isFetching = false;
            return fetchNextQuestion();
        }

        renderQuestion(qData);
        applyPlaceholderHints(qData);

        count = qData[0].question_num + 1;
        enableInputFor(qData[0]);

    } catch (e) {
        console.error('fetchNextQuestion error', e);
        addBotMessage(currentLang === 'it' ? 'Errore temporaneo. Riprova.' : 'Temporary error. Please try again.');
    } finally {
        isFetching = false;
    }
}

function renderQuestion(qData) {
    const q = qData[0];
    lastQuestionTitle = q.title || null;

    addBotMessage(q.question);

    if (q.type === 'select') {
        const multiple = (q.title === 'subject');
        addOptions(q.options || [], {multiple, name: q.title});
    } else {
        enableTextInput(q.title || '');
    }
}

function sendNotification(type) {
    if (!notificationId) {
        console.log('No notificationId yet, skipping notification:', type);
        return;
    }

    $.ajax({
        url: `${baseUrl}/sendNotification`,
        method: 'POST',
        data: {
            notificationId: notificationId,
            type: type,
            studentEmail: userData.email,
            tutorEmail: userData.tutor_email || '',
            language: currentLang
        },
        success: function () {
            console.log('Notification sent successfully:', type);
        },
        error: function (err) {
            console.error('Notification error:', err);
        }
    });
}

function startTutorSearch() {
    console.log('=== START TUTOR SEARCH ===');
    console.log('userData.email:', userData.email);
    console.log('isAssignTutor:', isAssignTutor);

    questionsCompleted = true;
    removeTypingAndLoading();
    addBotMessage(getLangText('processing'));

    if (!userData.email) {
        const n = Date.now();
        userData.email = `${n}student@gmail.com`;
        console.log('Generated email:', userData.email);
    }

    $.ajax({
        url: `${baseUrl}/question`,
        data: {
            language: currentLang,
            question: count,
            email: userData.email,
            subject: userData.subject,
            location: userData.location,
            age: userData.age,
            notificationId: notificationId
        },
        async: false,
        method: 'post',
        success: function (result) {
            console.log('Notification API response:', result);
            if (result?.data?.notificationId) {
                notificationId = result.data.notificationId;
                console.log('NotificationId saved:', notificationId);
            }
        },
        error: function (err) {
            console.error('Error creating notification:', err);
        }
    });

    setTimeout(() => {
        console.log('Starting polling... isAssignTutor:', isAssignTutor);
        removeTypingAndLoading();
        addTypingIndicator();

        if (isAssignTutor) {
            console.log('Calling checkTutorAssignOrNot for the first time');
            checkTutorAssignOrNot();
        }

        setIntervalTime = setInterval(() => {
            if (isAssignTutor) {
                console.log('Polling checkTutorAssignOrNot...');
                checkTutorAssignOrNot();
            }
        }, 2000);
    }, 250);

    setTimeout(function () {
        console.log('30s timeout reached. isAssignTutor:', isAssignTutor);
        clearInterval(setIntervalTime);
        if (isAssignTutor) {
            isAssignTutor = false;
            removeTypingAndLoading();
            addBotMessage(getLangText('noTutor'));
            endRequestUI(currentLang === 'it' ? 'Richiesta inviata' : 'Request sent');
        }
    }, 30000);
}

function checkTutorAssignOrNot() {
    console.log('=== CHECK TUTOR ASSIGN ===');
    console.log('isAssignTutor:', isAssignTutor);
    console.log('userData.email:', userData.email);

    if (!isAssignTutor || !userData.email) {
        console.log('Skipping check - conditions not met');
        return;
    }

    const checkUrl = `${baseUrl}/checkTutorAssignOrNot/${userData.email}`;
    console.log('Calling:', checkUrl);

    $.ajax({
        url: checkUrl,
        method: 'GET',
        success: function (result) {
            console.log('Tutor assignment check result:', result);
            if (result?.data && isAssignTutor && isAssignTutor_check) {
                console.log('Tutor found! Calling assignTutor()');
                isAssignTutor_check = false;
                assignTutor();
            }
        },
        error: function (err) {
            console.error('Check tutor error:', err);
        }
    });
}

function assignTutor() {
    console.log('=== ASSIGN TUTOR ===');
    $.ajax({
        url: `${baseUrl}/getStudentTutor`,
        method: 'POST',
        data: userData,
        success: function (result) {
            console.log('Assign tutor result:', result);
            isAssignTutor = false;
            clearInterval(setIntervalTime);
            removeTypingAndLoading();

            if (result.success) {
                const tutor = result.data.tutor;
                userData.tutor_name = tutor.name;
                userData.tutor_surname = tutor.surname;
                userData.tutor_email = tutor.email;
                userData.tutor_mobile = tutor.mobileNumber;
                userData.tutor_description = tutor.description;

                if (result.data.notificationId) {
                    notificationId = result.data.notificationId;
                }

                const tutorHTML = `
                    <div class="tutor-card">
                        ${tutor.imageUrl ? `<img src="${tutor.imageUrl}" alt="${tutor.name}">` : ''}
                        <p>${tutor.description}</p>
                    </div>
                `;
                addMessage(tutorHTML, 'bot', true);

                sendNotification('tutor_assigned');

                setTimeout(() => {
                    addBotMessage(getLangText('phoneQuestion'));
                    setTimeout(() => {
                        lastQuestionTitle = 'phone_number';
                        const input = document.getElementById('userInput');
                        input.placeholder = currentLang === 'it' ? 'Inserisci il tuo numero' : 'Enter your phone number';
                        enableTextInput();
                    }, 300);
                }, 2000);

            } else {
                addBotMessage(getLangText('noTutor'));
                endRequestUI(currentLang === 'it' ? 'Nessun tutor disponibile' : 'No tutor available');
            }
        },
        error: function (err) {
            console.error('Assign tutor error:', err);
            isAssignTutor = false;
            clearInterval(setIntervalTime);
            removeTypingAndLoading();
            addBotMessage(getLangText('noTutor'));
            endRequestUI(currentLang === 'it' ? 'Nessun tutor disponibile' : 'No tutor available');
        }
    });
}

function endRequestUI(placeholderText) {
    const input = document.getElementById('userInput');
    const btn = document.getElementById('sendButton');
    input.disabled = true;
    btn.disabled = true;
    input.placeholder = placeholderText || getLangText('conversationEnded');
    input.style.backgroundColor = '#f5f5f5';
    input.style.color = '#888';
    input.style.cursor = 'not-allowed';
    btn.style.backgroundColor = '#ccc';
    btn.style.cursor = 'not-allowed';
}

function endConversationUI() {
    removeTypingAndLoading();
    const phone = userData.tutor_mobile || (currentLang === 'it' ? 'il numero che ti è stato fornito' : 'the number provided to you');
    const msg = getLangText('contactMessage').replace('{phone}', phone);
    addBotMessage(msg);

    sendNotification('conversation_completed');

    endRequestUI(getLangText('conversationEnded'));
}

function sendToFormspree(userData, phoneNumber) {
    $.ajax({
        url: 'https://formspree.io/f/xwprwgvw',
        method: 'POST',
        data: {
            phone_number: phoneNumber,
            subjects: Array.isArray(userData.subject) ? userData.subject.join(', ') : userData.subject,
            location: userData.location,
            school_year: userData.age,
            email: userData.email,
            tutor_name: userData.tutor_name || '',
            tutor_surname: userData.tutor_surname || '',
            tutor_email: userData.tutor_email || '',
            tutor_mobile: userData.tutor_mobile || '',
            tutor_description: userData.tutor_description || '',
            notificationId: notificationId
        },
        success: function () {
            console.log('Formspree submission successful');
        },
        error: function (err) {
            console.error('Formspree error:', err);
        }
    });
}

document.getElementById('sendButton').addEventListener('click', handleTextSubmit);
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleTextSubmit();
    }
});

document.getElementById('languageChange').addEventListener('change', function () {
    currentLang = this.value;
    document.getElementById('sendButton').textContent = getLangText('send');

    const firstMessage = document.querySelector('.message.bot');
    if (firstMessage && document.querySelectorAll('.message').length === 1) {
        firstMessage.querySelector('.message-bubble').textContent = getLangText('welcome');
    }

    const input = document.getElementById('userInput');
    const currentPlaceholder = input.placeholder;

    if (currentPlaceholder.includes('option') || currentPlaceholder.includes('opzione')) {
        input.placeholder = getLangText('selectOption');
    } else if (currentPlaceholder.includes('materie') || currentPlaceholder.includes('subjects') || currentPlaceholder.includes('almeno')) {
        input.placeholder = currentLang === 'it' ? 'Seleziona almeno una materia' : 'Select at least one subject';
    } else if (currentPlaceholder.includes('digita') || currentPlaceholder.includes('Type')) {
        input.placeholder = getLangText('typeHere');
    } else if (currentPlaceholder.includes('telefono') || currentPlaceholder.includes('phone')) {
        input.placeholder = currentLang === 'it' ? 'Inserisci il tuo numero' : 'Enter your phone number';
    }


    const counter = document.getElementById('subjectCounter');
    if (counter) {
        const count = selectedSubjects.length;
        counter.textContent = `${getLangText('selected')} ${count} ${getLangText('of')} 2`;
    }
});

window.addEventListener('load', function () {
    setTimeout(() => {
        addBotMessage(getLangText('welcome'));
        setTimeout(() => {
            fetchNextQuestion();
        }, 800);
    }, 300);
});
