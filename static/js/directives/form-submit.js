angular
    .module('PeerSay')
    .directive('psFormSubmit', psFormSubmit);

psFormSubmit.$inject = ['$timeout', 'jQuery'];
function psFormSubmit($timeout, $) {
    return {
        restrict: 'A',
        scope: {
            submit: '&psFormSubmit',
            submitControl: '=psFormSubmitControl'
        },
        link: function (scope, element, attr) {
            var $form = $(element)
                .submit(submitHandler);

            function submitHandler(evt) {
                //console.log('>>> Submit handler, submitting?=', $form.submitting);

                // Prevent standard form submit on button click or Enter
                evt.preventDefault();
                evt.stopPropagation();

                //Locked to prevent double-submit while in progress of ajax
                if ($form.submitting) { return; }

                // Trigger submit via ajax, on success ctl will change psFormSubmitOn,
                // which will re-submit form normally in $watch below
                scope.$apply(function () {
                    scope.submit();
                });
            }

            scope.$watch('submitControl', function (newVal) {
                //console.log('>>> Watch attr fired: ', newVal);

                if (newVal === 'submit') {
                    // Remove our handler and submit form normally.
                    // This will causes browser reload => app exit
                    $form.off('submit', submitHandler);
                    $form.submit();
                }
                else if (newVal === 'lock') {
                    // Ajax returned error => need to unlock
                    $form.submitting = true;
                }
                else if (newVal === 'unlock') {
                    // Ajax returned error => need to unlock
                    $form.submitting = false;
                }
            });
        }
    };
}