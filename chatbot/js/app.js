$('#languageChange').on('change', function () {
    if ($('#languageChange').val() === 'it') {
        $('#question-data-it').show();
        $('#question-data-en').hide();

        $('.message:first-child').html('')
        $('.message:first-child').html('Ciao! In meno di 1 minuto troviamo un tutor giusto per Te gratuitamente. Rispondi a 3 semplici domande e riceverai il contatto del tutor. Clicca qui sotto 👇')
        $("#convForm .option:first-child").html('INIZIAMO!')
        $("#convForm .option:first-child").text('INIZIAMO!')

        $("#convForm .option:first-child").val('INIZIAMO!')
        if ($("#userInput").attr("placeholder") == "Select an option" || $("#userInput").attr("placeholder") == "seleziona un'opzione") {
            $("#userInput").attr("placeholder", "Seleziona un'opzione");
        } else {
            $("textarea#userInput").attr("placeholder", "...");
        }
        $(".submit").html('invia');

    } else {
        $('#question-data-en').show();
        $('#question-data-it').hide();

        $('.message:first-child').html('')
        $('.message:first-child').html('Hi! In less than a minute, we\'ll find the right tutor for you for free. Answer 3 simple questions and you\'ll receive the tutor\'s contact. Click below. 👇')
        $("#convForm .option:first-child").html('Let\'s start')
        $(".option:first-child").html('Let\'s start')
        if ($("#userInput").attr("placeholder") == "seleziona un'opzione" || $("#userInput").attr("placeholder") == "Select an option") {
            $("#userInput").attr("placeholder", "Select an option");
        } else {
            $("textarea#userInput").attr("placeholder", "...");
        }
        $(".submit").html('Send');
    }
});

jQuery(function ($) {
    const baseUrl = 'https://tvtorbackend.onrender.com/api/v1';
    var userData = {};
    var isAssignTutor = true;
    var isAssignTutor_check = true;
    var setIntervalTime;
    var newQuestion = '';
    var count = 3;
    var lastNext = 0;
    let notificationId = ""
    var url = `${baseUrl}/question`
    var convForm = $('#chat').convform({
        selectInputStyle: 'disable',
        selectInputDisabledText: "seleziona un'opzione",
        eventList: {
            onInputSubmit: function (convState, ready) {
                get_question(convState, ready);
                if (convState.current.input.name == "age") {
                    $("#chat").removeClass("danger");
                }
            }
        }
    });

    $(document).on('click', '.option', function() {
        autoClickExecuted = true;

        if ($(this).closest('.conv-form-wrapper').find('input[name="subject"]').length > 0) {
            setTimeout(function() {
                var selectedSubjects = $('.option.selected').length;

                if (selectedSubjects >= 2) {
                    $("#userInput").attr("placeholder", "");
                } else if (selectedSubjects === 1) {
                    if ($('#languageChange').val() == 'it') {
                        $("#userInput").attr("placeholder", "Seleziona fino a 2 materie");
                    } else {
                        $("#userInput").attr("placeholder", "Select up to 2 subjects");
                    }
                }
            }, 100);
        }
    });

    setTimeout(function() {
        $('#languageChange').val('it').trigger('change');

        setTimeout(function() {
            if ($("#userInput").length && $("#userInput").attr("placeholder") === "Select an option") {
                $("#userInput").attr("placeholder", "seleziona un'opzione");
            }
        }, 100);
    }, 500);

    var autoClickExecuted = false;
    setTimeout(function() {
        var checkButton = setInterval(function() {
            var button = $(".option").first();
            if (button.length > 0 && button.is(':visible') && !autoClickExecuted) {
                if (!$('.message').length || $('.message').length === 1) {
                    clearInterval(checkButton);
                    button.click();
                    autoClickExecuted = true;
                    console.log('Auto-clicked the start button');
                }
            }
        }, 20);

        setTimeout(function() {
            clearInterval(checkButton);
        }, 6000);
    }, 6000);

    function locationCheck() {
        var checkLocationUrl = `${baseUrl}/getTutorsLocation`;
        jQuery.ajax({
            url: checkLocationUrl, async: true, method: 'post', data: userData, success: function (result) {
                if (result.statusCode == 404) {
                    var que = "There is no tutor are available on this location";
                    $('#messages').append('<div class="message to ready">' + que + '</div>').animate({ scrollTop: $("#messages").offset().top + 600 }, 600);
                    return false;
                } else {
                    return true;
                }
            }
        })
    }

    function checkTutorAssignOrNot(convState, ready) {
        console.log('Checking tutor assignment...');
        var checkLocationUrl = `${baseUrl}/checkTutorAssignOrNot/${userData.email}`;
        if (isAssignTutor) {
            jQuery.ajax({
                url: checkLocationUrl, async: true, method: 'get', data: userData, success: function (result) {
                    console.log('Tutor assignment check result:', result);
                    if (result.data && isAssignTutor && isAssignTutor_check) {
                        isAssignTutor_check = false
                        assignTutor(convState, ready);
                    }
                }
            })
        }
    }

    function sendToFormspree(userData, phoneNumber) {
        var formData = {
            phone_number: phoneNumber,
            subjects: Array.isArray(userData.subject) ? userData.subject.join(', ') : userData.subject,
            location: userData.location,
            school_year: userData.age,
            email: userData.email,
            tutor_name: userData.tutor_name || '',
            tutor_surname: userData.tutor_surname || '',
            tutor_email: userData.tutor_email || '',
            tutor_mobile: userData.tutor_mobile || '',
            tutor_description: userData.tutor_description || ''
        };

        jQuery.ajax({
            url: 'https://formspree.io/f/xwprwgvw',
            method: 'POST',
            data: formData,
            success: function(response) {
                console.log('Data sent to Formspree successfully');
            },
            error: function(xhr, status, error) {
                console.log('Error sending to Formspree:', error);
            }
        });
    }

    function assignTutor(convState, ready) {
        var assignTutorUrl = `${baseUrl}/getStudentTutor`;
        jQuery.ajax({
            url: assignTutorUrl, async: true, method: 'post', data: userData, success: function (result) {
                isAssignTutor = false;
                clearInterval(setIntervalTime);
                var que;
                if ($('#languageChange').val() == 'en') {
                    que = "There is no tutor available right now. Thank you!";
                } else if ($('#languageChange').val() == 'it') {
                    que = "Non ci sono tutor disponibili al momento.";
                }
                let image;
                let name;
                let surname;
                let contactMessage = '';

                if (result.success) {
                    name = result.data.tutor.name;
                    surname = result.data.tutor.surname;
                    const email = result.data.tutor.email;
                    const mobileNumber = result.data.tutor.mobileNumber;
                    const profileImage = result.data.tutor.imageUrl;
                    const description = result.data.tutor.description;
                    notificationId = result.data.notificationId;
                    image = profileImage;

                    userData.tutor_name = name;
                    userData.tutor_surname = surname;
                    userData.tutor_email = email;
                    userData.tutor_mobile = mobileNumber;
                    userData.tutor_description = description;
                    $('#messages .message').filter(function () {
                        var txt = $(this).text().trim();
                        return $(this).hasClass('typing') || $(this).hasClass('loading') || txt === '...';
                    }).remove();
                    if ($('#languageChange').val() == 'en') {
                        que = description;
                        contactMessage = `You can now contact the tutor at the number ${mobileNumber}. Have a nice lesson!`;
                    } else if ($('#languageChange').val() == 'it') {
                        que = description;
                        contactMessage = `Ora puoi contattare il tutor al numero ${mobileNumber}. Buona lezione!`;
                    }
                }

                if (image) {
                    $('#messages').append('<div class="message to ready image_size"><img src="' + image + '" alt="" width="120" height="120"><figcaption>' + que + '</figcaption></div>').animate({ scrollTop: $("#messages").offset().top + 900 }, 600);
                } else {
                    $('#messages').append('<div class="message to ready">' + que + '</div>').animate({ scrollTop: $("#messages").offset().top + 900 }, 600);
                }

                setTimeout(() => {
                    var phoneQuestion = $('#languageChange').val() == 'it' ?
                        'Inserisci il tuo numero di telefono per essere contattato dal tutor:' :
                        'Enter your phone number to be contacted by the tutor:';

                    $('#messages').append('<div class="message to ready">' + phoneQuestion + '</div>').animate({ scrollTop: $("#messages").offset().top + 900 }, 600);

                    setTimeout(function () {
                        convState.current.next = convState.newState({
                            type: 'text',
                            name: 'phone_number',
                            questions: [phoneQuestion],
                            pattern: '^[+]?[0-9\\s\\-\\(\\)]{8,15}$'
                        });
                        $("#userInput").attr("placeholder", $('#languageChange').val() == 'it' ? 'Inserisci il tuo numero' : 'Enter your phone number');
                        setTimeout(function(){
                            $("#userInput:visible").focus();
                        }, 200);
                        ready();
                    }, 300);
                }, 2000);

                if (!result.success) {
                    setTimeout(() => {
                        // Rimuovi messaggi di caricamento o typing residui
                        $('#messages .message').filter(function() {
                            return $(this).hasClass('typing') || $(this).hasClass('loading') || $(this).text().trim() === '...';
                        }).remove();

                        $('#userInput').prop('disabled', true);
                        $('.submit').prop('disabled', true);
                        $('#userInput').attr('placeholder', $('#languageChange').val() == 'it' ? 'Nessun tutor disponibile' : 'No tutor available');
                        $('#userInput').css({
                            'background-color': '#f5f5f5',
                            'color': '#888',
                            'cursor': 'not-allowed'
                        });
                        $('.submit').css({
                            'background-color': '#ccc',
                            'cursor': 'not-allowed'
                        });
                    }, 1000);
                }
            }
        });
    }

    function get_question(convState, ready) {
        if (convState.current.answer.value === 'end') {
            setTimeout(ready, Math.random() * 500 + 100);
        } else {
            if (Array.isArray(convState.current.answer)) {
                var answer = convState.current.answer;
                userData[convState.current.input.name] = answer;
            }
            else {
                var answer = convState.current.answer.text;
                userData[convState.current.input.name] = answer;
            }

            if (convState.current.input.name === 'phone_number') {
                sendToFormspree(userData, answer);

                setTimeout(() => {
                    // Rimuovi messaggi di caricamento o typing residui
                    $('#messages .message').filter(function() {
                        return $(this).hasClass('typing') || $(this).hasClass('loading') || $(this).text().trim() === '...';
                    }).remove();
                    var contactMessage = $('#languageChange').val() == 'it' ?
                        `Ora puoi contattare il tutor al numero ${userData.tutor_mobile || 'il numero che ti è stato fornito'}. Buona lezione!` :
                        `You can now contact the tutor at the number ${userData.tutor_mobile || 'the number provided to you'}. Have a nice lesson!`;

                    $('#messages').append('<div class="message to ready">' + contactMessage + '</div>').animate({ scrollTop: $("#messages").offset().top + 900 }, 600);

                    $('#userInput').prop('disabled', true);
                    $('.submit').prop('disabled', true);
                    $('#userInput').attr('placeholder', $('#languageChange').val() == 'it' ? 'Conversazione terminata' : 'Conversation ended');
                    $('#userInput').css({
                        'background-color': '#f5f5f5',
                        'color': '#888',
                        'cursor': 'not-allowed'
                    });
                    $('.submit').css({
                        'background-color': '#ccc',
                        'cursor': 'not-allowed'
                    });
                }, 1000);

                return;
            }

            console.log('Saving answer:', {
                fieldName: convState.current.input.name,
                answer: convState.current.answer,
                userData: userData
            });
            var queryString = '';
            if (userData.age && userData.subject && !userData.website) {
                var d = new Date();
                var n = d.getTime();
                userData.email = n + 'student' + '@gmail.com'
            }

            if (userData.age && userData.subject && userData.location) {
                console.log('All data collected, starting tutor assignment process...');

                jQuery.ajax({
                    url: `${baseUrl}/question`,
                    data: {
                        language: $('#languageChange').val(),
                        question: count,
                        email: userData.email,
                        subject: userData.subject,
                        location: userData.location,
                        mobilenumber: userData.mobilenumber,
                        age: userData.age,
                        website: userData.website,
                        notificationId: notificationId
                    },
                    async: false,
                    method: 'post',
                    success: function (result) {
                        console.log('Notification created successfully');
                    }
                });

                setTimeout(() => {
                    $('#messages .message').filter(function () {
                        var txt = $(this).text().trim();
                        return $(this).hasClass('typing') || $(this).hasClass('loading') || txt === '...';
                    }).remove();
                    var processingMessage = $('#languageChange').val() == 'it' ?
                        'Grazie! Stiamo cercando il miglior tutor per te. Attendi per favore...' :
                        'Thank you! We\'re finding the best tutor for you. Please wait...';

                    $('#messages').append('<div class="message to ready">' + processingMessage + '</div>').animate({ scrollTop: $("#messages").prop("scrollHeight") }, 600);
                    setTimeout(() => {
                        $('#messages').append('<div class="message to ready typing">...</div>').animate({ scrollTop: $("#messages").prop("scrollHeight") }, 600);
                    }, 10000);
                    if (isAssignTutor) {
                        checkTutorAssignOrNot(convState, ready);
                    }

                    setIntervalTime = setInterval(() => {
                        if (isAssignTutor) {
                            checkTutorAssignOrNot(convState, ready);
                        }
                    }, 2000);
                }, 250);

                setTimeout(function () {
                    clearInterval(setIntervalTime);
                    if (isAssignTutor) {
                        isAssignTutor = false;

                        // Rimuovi TUTTE le bubbles "..." e di loading/typing
                        $('#messages .message').filter(function () {
                            var txt = $(this).text().trim();
                            return $(this).hasClass('typing') || $(this).hasClass('loading') || txt === '...';
                        }).remove();

                        var timeoutMessage = $('#languageChange').val() == 'it' ?
                            'Non ci sono tutor disponibili al momento. Scrivici al +39 3485804824!' :
                            'No tutors are available right now. Contact us at +393485804824!';

                        $('#messages').append('<div class="message to ready">' + timeoutMessage + '</div>').animate({ scrollTop: $("#messages").prop("scrollHeight") }, 600);
                        $('#userInput').prop('disabled', true);
                        $('.submit').prop('disabled', true);
                        $('#userInput').attr('placeholder', $('#languageChange').val() == 'it' ? 'Richiesta inviata' : 'Request sent');
                        $('#userInput').css({
                            'background-color': '#f5f5f5',
                            'color': '#888',
                            'cursor': 'not-allowed'
                        });
                        $('.submit').css({
                            'background-color': '#ccc',
                            'cursor': 'not-allowed'
                        });
                    }
                }, 30000); // timeout dopo 30 secondi



                return;
            }

            if (count >= 6) {
                setTimeout(ready, 500);
                return;
            }

            for (var key in userData) {
                if (userData.hasOwnProperty(key)) {
                    queryString += '&' + key + '=' + userData[key];
                }
            }

            console.log('Sending data:', userData);
            console.log('Count:', count);

            jQuery.ajax({
                url, data: {
                    language: $('#languageChange').val(), question: count, email: userData.email, subject: userData.subject, location: userData.location, mobilenumber: userData.mobilenumber, age: userData.age, website: userData.website, notificationId: notificationId
                }, async: false, method: 'post',
                success: function (result) {
                    var qData = result.data.data;
                    if (qData[0].type == "select" && qData[0].languageCode == "it") {
                        setTimeout(function () {
                            if (qData[0].title === 'subject') {
                                $("#userInput").attr("placeholder", "Seleziona fino a 2 materie");
                                $("div.options.dragscroll").addClass("subject-selection");
                                $("#messages").addClass("subject-selection");
                                $("div.options.dragscroll").removeClass("location-selection");
                                $("#messages").removeClass("location-selection");
                            } else if (qData[0].title === 'location') {
                                $("#userInput").attr("placeholder", "seleziona un'opzione");
                                $("div.options.dragscroll").addClass("location-selection");
                                $("#messages").addClass("location-selection");
                                $("div.options.dragscroll").removeClass("subject-selection");
                                $("#messages").removeClass("subject-selection");
                            } else {
                                $("#userInput").attr("placeholder", "seleziona un'opzione");
                                $("div.options.dragscroll").removeClass("subject-selection location-selection");
                                $("#messages").removeClass("subject-selection location-selection");
                            }
                        }, 2000);
                    }
                    else if (qData[0].type == "select" && qData[0].languageCode == "en") {
                        setTimeout(function () {
                            if (qData[0].title === 'subject') {
                                $("#userInput").attr("placeholder", "Select up to 2 subjects");
                                $("div.options.dragscroll").addClass("subject-selection");
                                $("#messages").addClass("subject-selection");
                                $("div.options.dragscroll").removeClass("location-selection");
                                $("#messages").removeClass("location-selection");
                            } else if (qData[0].title === 'location') {
                                $("#userInput").attr("placeholder", "Select an option");
                                $("div.options.dragscroll").addClass("location-selection");
                                $("#messages").addClass("location-selection");
                                $("div.options.dragscroll").removeClass("subject-selection");
                                $("#messages").removeClass("subject-selection");
                            } else {
                                $("#userInput").attr("placeholder", "Select an option");
                                $("div.options.dragscroll").removeClass("subject-selection location-selection");
                                $("#messages").removeClass("subject-selection location-selection");
                            }
                        }, 2000);

                    }
                    else if (qData[0].type == "text" && qData[0].languageCode == "en") {
                        setTimeout(function () {
                            if (qData[0].title === 'age') {
                                $("#userInput").attr("placeholder", "Type Here");
                            } else {
                                $("#userInput").attr("placeholder", "...");
                            }
                        }, 5);

                    }
                    else if (qData[0].type == "text" && qData[0].languageCode == "it") {
                        setTimeout(function () {
                            if (qData[0].title === 'age') {
                                $("#userInput").attr("placeholder", "digita qui");
                            } else {
                                $("#userInput").attr("placeholder", "...");
                            }
                        }, 5);
                    } else if (qData[0].title == "contacting_tutor" && qData[0].languageCode == "it") {
                        setTimeout(function () {
                            $("#userInput").attr("placeholder", "seleziona un'opzione");
                        }, 2000);
                    }

                    var pattern = '';
                    for (var i = 0; i < qData.length; i++) {
                        if (qData[i].title == 'email') {
                            pattern = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$";
                        }
                        newQuestion = qData[i].question;
                        count = qData[i].question_num;
                        var questionTitle = qData[i].title;
                        var questionTitleLower = (qData[i].title || '').toLowerCase();
                        if (questionTitleLower === 'mobilenumber' || questionTitleLower === 'phone_number' || questionTitleLower === 'phone' || questionTitleLower === 'telefono' || questionTitleLower === 'numero') {
                            continue; // Salta la domanda del telefono: la mostra solo il front-end dopo tutor!
                        }
                        newQuestion = newQuestion.replace("{name}", answer);

                        if (qData[i].no_answer == 1) {
                            convState.current.next = convState.newState({
                                type: 'text',
                                noAnswer: true,
                                name: questionTitle,
                                questions: [newQuestion],
                            });
                            lastNext = 1;
                        } else {
                            if (lastNext == 1) {
                                lastNext = 0;
                                if (qData[i].type == 'text') {
                                    convState.current.next.next = convState.newState({
                                        type: 'text',
                                        name: questionTitle,
                                        pattern: pattern,
                                        questions: [newQuestion],
                                    });
                                } else {
                                    convState.current.next.next = convState.newState({
                                        type: 'select',
                                        name: questionTitle,
                                        questions: [newQuestion],
                                        answers: qData[i].options,
                                        multiple: questionTitle === 'subject',
                                        selected: questionTitle === 'subject' ? [] : ""
                                    });
                                }
                            } else {
                                if (qData[i].type == 'text') {
                                    convState.current.next = convState.newState({
                                        type: 'text',
                                        pattern: pattern,
                                        name: questionTitle,
                                        questions: [newQuestion],
                                    });

                                } else {
                                    answersOption = qData[i].options;
                                    convState.current.next = convState.newState({
                                        type: 'select',
                                        name: questionTitle,
                                        questions: [newQuestion],
                                        answers: answersOption,
                                        multiple: questionTitle === 'subject',
                                        selected: questionTitle === 'subject' ? [] : ""
                                    });
                                }
                            }
                        }
                    }
                }
            });
            setTimeout(ready, Math.random() * 500 + 500);
        }
        count++;
    }
});
