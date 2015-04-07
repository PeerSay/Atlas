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

    var $modal = $('#modal-eval')
        .modal({
            backdrop: 'static',
            show: false
        })
        .on('show.bs.modal', initForm);
    var $form = $('#reg-form').submit(submitForm);
    var $submitBtn = $modal.find('.js-submit')
        .click(function () {
            $form.submit();
        });
    var $email = $('#ev-email').keyup(function () {
        toggleFormWarning(false);
    });
    var $pageEmail = $('#signup-email');

    function initForm() {
        $email.val($pageEmail.val().trim());

        toggleThanksPage(false);
    }

    function updatePage() {
        $pageEmail.val($email.val());
    }

    function submitForm() {
        if (!validateForm()) {
            toggleFormWarning(true);
            return false;
        }

        var path = "/api/waiting-users";
        var data = getFormData();
        console.log('>> POST: ', data);

        $.ajax({
            url: path,
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                console.log('>> Response: ', res);
                toggleThanksPage(true, res.email);
                updatePage();
            },
            error: function () {
                //TODO
            }
        });

        return false;
    }

    function getFormData() {
        var arr = $form.serializeArray();
        var result = {};

        $.each(arr, function (i, o) {
            result[o.name] = o.value;
        });
        return result;
    }

    function validateForm() {
        return validateEmail($email.val());
    }

    function validateEmail(val) {
        val = val.trim();
        if (!val) { return false; } // required!

        var simpleEmailRe = /\S+@\S+\.\S+/;
        return simpleEmailRe.test(val);
    }

    function toggleFormWarning(on) {
        var $group = $email.closest('.form-group');
        if (on) {
            $slider.carousel(0);
            $group.addClass('has-error');
            $email.get(0).focus();
        }
        else {
            $group.removeClass('has-error');
        }
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
        } else {
            history.pushState("", document.title, window.location.pathname);
        }
    }
});
