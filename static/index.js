$(function () {
    /*-----------------------------------------------
     Smooth-scroll to a section on anchor click
     -------------------------------------------------*/

    $('a.page-scroll').on('click', function (event) {
        var menuOffsetTop = 80;
        var $anchor = $(this);
        var uri = $anchor.attr('href');
        uri = (uri !== '/') ? uri : '';
        var newScrollTop = uri ? $(uri).offset().top - menuOffsetTop : 0;

        $('html, body').stop().animate({scrollTop: newScrollTop}, 800, function () {
            // XXX - this causes scroll in FF, which hides part of the header - #59
            //window.location.hash = uri;
        });

        // Prevent location change
        event.preventDefault();
    });


    /*-----------------------------------------------
     Circle Figure control
     -------------------------------------------------*/

    $('.icon-lg')
        .hover(toggleContentFn(true), toggleContentFn(false));

    function toggleContentFn(on) {
        return function () {
            var $target = $($(this).attr('data-target'));
            $target.toggleClass('active', on);
        };
    }


    /*-----------------------------------------------
     Modal: Slider
     -------------------------------------------------*/

    var $slider = $('#modal-slides').on('slide.bs.carousel', function (evt) {
        toggleSliderControl(evt.direction);
    });
    var $controls = $slider.find('.carousel-control');
    toggleSliderControl('right');

    function toggleSliderControl(direction) {
        var oppositeClass = {
            left: '.right',
            right: '.left'
        };
        $controls.show();
        $controls.filter(oppositeClass[direction]).hide();
    }


    /*-----------------------------------------------
     Modal: Forms
     -------------------------------------------------*/

    var $modal = $('#start')
        .modal({
            backdrop: 'static',
            show: false
        })
        .on('show.bs.modal', initRegForm)
        .on('shown.bs.modal', initRegFormShown);
    var $regForm = $('#reg-form').submit(submitRegForm);
    var $submitBtn = $modal.find('.js-submit').click(function () {
        $regForm.submit();
    });
    var $email = $('#ev-email').keyup(function () {
        toggleFormWarning($(this), false);
    });
    var $pageEmail = $('#signup-email');

    function initRegForm() {
        $email.val($pageEmail.val().trim());
        toggleThanksPage(false);
    }

    function initRegFormShown() {
        $email.focus();
    }

    function updatePageVal() {
        $pageEmail.val($email.val());
    }

    function submitRegForm() {
        if (!validateRegForm()) {
            return false;
        }
        updatePageVal();

        var url = "/api/waiting-users";
        submitForm($regForm, url, function (err, res) {
            if (err) {
                // todo?
                return;
            }

            toggleThanksPage(true, res.email);
            trackPage('/#start-thanks');
        });

        return false; // prevent default
    }

    function validateRegForm() {
        var res = validateForm($email);
        if (res.length) {
            var err = res[0]; // can be only one
            toggleFormWarning(err.$el, true, err.error);

            $slider.carousel(0);
            $email.focus();
            return false;
        }

        return true;
    }

    function toggleThanksPage(on, email) {
        var $page = $modal.find('.thanks-page');

        $submitBtn.toggle(!on);
        $modal.find('.carousel').toggle(!on);

        $page.toggle(on);
        if (on) {
            $page.find('.email-subst').text(email);
        }
    }

    /*-----------------------------------------------
     Deep-linking for Modals
     -------------------------------------------------*/

    $('.modal.js-deep-link')
        .on('shown.bs.modal', toggleLocationHashFn(true))
        .on('hidden.bs.modal', toggleLocationHashFn(false));

    $(window).on('hashchange', showDialogOnHashChange);
    showDialogOnHashChange(); // hashchange not triggered on page load

    function showDialogOnHashChange() {
        var $modal = $(window.location.hash);
        var $openModal = $('.modal.in');
        var hasOpenModal = !!$openModal.length;

        if (!$modal.length) {
            // No modals with such hash exists - close modal if open
            $openModal.modal('hide');
            return;
        }

        if ($modal.is($openModal)) {
            // Same dialog
            return;
        }

        // If some dialog is open already (which means it is a link click from that dialog),
        // then we reload the page to let dialog go, because show/close dialog works badly in Bootstrap.
        if (hasOpenModal) {
            window.location.reload(true);
        }
        else {
            $modal.modal('show');
        }
    }

    function toggleLocationHashFn(on) {
        return function () {
            var $modal = $(this);
            var id = $modal.get(0).id;
            var hash = '#' + id;

            toggleLocationHash(on, hash);
        };
    }

    function toggleLocationHash(on, hash) {
        var same = (window.location.hash === hash);
        if (same === !!on) { return; }

        if (on) {
            window.location.hash = hash;
            trackPage('/' + hash);
        } else {
            history.pushState("", document.title, window.location.pathname);
        }
    }

    /*-----------------------------------------------
     Contact - Send Email
     -------------------------------------------------*/

    var $contactForm = $('#contact-form').submit(submitContactForm);
    var $contactFormBtn = $contactForm.find('.js-submit').click(function () {
        $contactForm.submit();
    });
    var $progress = $contactForm.find('.progress');
    var $fields = $contactForm.find('[name]')
        .keyup(function () {
            toggleFormWarning($(this), false);
        });

    function submitContactForm() {
        if (!validateContactForm()) {
            return false;
        }

        toggleSendProgress('sending');
        toggleSendProgress('sent', 1000);

        var url = "/api/say-hello";
        submitForm($contactForm, url, function (err, res) {
            toggleSendProgress(false, 5000);

            if (err) {
                console.log('>>Err: ', err.xhr.responseText);
            }

            // Nothing by design
        });

        return false; // prevent default
    }

    function validateContactForm() {
        var res = validateForm($fields);
        if (res.length) {
            $.each(res, function (i, it) {
                toggleFormWarning(it.$el, true, it.error);
            });
            res[0].$el.focus();
            return false;
        }

        return true;
    }

    function toggleSendProgress(className, delay) {
        var toggle = function () {
            $progress.toggleClass('sending sent', false);
            if (className) {
                $progress.toggleClass(className, true);
            }
        };

        if (delay) {
            setTimeout(toggle, delay);
        } else {
            toggle();
        }
    }

    /*-----------------------------------------------
     Util
     -------------------------------------------------*/

    // Ajax
    function submitForm($form, url, cb) {
        var data = getFormData($form);
        //console.log('>> POST: ', data);

        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                //console.log('>> Response: ', res);
                cb(null, res)
            },
            error: function (jqXHR, textStatus, errorThrown ) {
                var err = {
                    status: textStatus,
                    httpStatus: errorThrown,
                    xhr: jqXHR
                };
                cb(err, null);
            }
        });

        //////

        function getFormData($form) {
            var arr = $form.serializeArray();
            var result = {};

            $.each(arr, function (i, o) {
                result[o.name] = o.value;
            });
            return result;
        }
    }

    // Form Validation
    function validateForm($fields) {
        // Returns: [ {$el: $(), error: 'required' | 'email'}, ...]
        var result = [];
        $fields.each(function (i, el) {
            var $el = $(el), error = null;
            if ($el.data('required') && !validateRequired($el.val())) {
                error = 'required';
            }
            else if ($el.data('email') && !validateEmail($el.val())) {
                error = 'email';
            }

            if (error) {
                result.push({
                    $el: $el,
                    error: error
                });
            }
        });
        return result;
    }

    function validateRequired(val) {
        val = val.trim();
        return !!val;
    }

    function validateEmail(val) {
        val = val.trim();
        var simpleEmailRe = /\S+@\S+\.\S+/;
        return simpleEmailRe.test(val);
    }

    function toggleFormWarning($el, on, errorClass) {
        var $group = $el.closest('.form-group');
        if (on) {
            $group.addClass('has-error ' + errorClass);
        } else {
            $group.removeClass('has-error email required');
        }
    }

    /*-----------------------------------------------
     Analytics
     -------------------------------------------------*/

    function trackPage(page) {
        console.log('>>GA tracking [%s] ', page, !window.ga ? '(skipped)' : '');
        if (window.ga) {
            ga('send', 'pageview', page);
        }
    }
});
