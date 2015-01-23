angular
    .module('peersay')
    .directive('psInputValidate', function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                allowEmpty: '=psAllowEmpty',
                validate: '=psInputValidate'
            },
            link: function (scope, elem, attrs, ctrl) {
                ctrl.$validators.inputValidate = function (modelValue, viewValue) {
                    if (scope.allowEmpty && ctrl.$isEmpty(modelValue)) {
                        return true; // not allowed for edit vendor names
                    }

                    if (scope.validate(modelValue)) {
                        return true;
                    }

                    return false;
                };
            }
        };
    });