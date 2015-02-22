/*global angular:true*/

angular.module('PeerSay')
    .factory('Wizard', Wizard);

Wizard.$inject = ['$state', '$stateParams', '$timeout', 'Util'];
function Wizard($state, $stateParams, $timeout, _) {
    var W = {};
    W.steps = [
        {
            idx: 1,
            state: '.essentials',
            shortTitle: 'Essentials',
            title: 'Project Essentials',
            enabled: true,
            reached: true,
            current: false
        },
        {
            idx: 2,
            state: '.requirements',
            shortTitle: 'Requirements',
            title: 'Project Requirements',
            enabled: true,
            reached: false,
            current: false
        },
        {
            idx: 3,
            state: '.products',
            shortTitle: 'Products',
            title: 'Product Input',
            enabled: false,
            reached: false,
            current: false
        },
        {
            idx: 4,
            state: '.shortlist',
            shortTitle: 'Decisions',
            title: 'Shortlist',
            enabled: false,
            reached: false,
            current: false
        }
    ];
    W.load = load;
    W.progress = progress;
    W.isReached = isReached;
    W.openDialog = openDialog;
    W.closeDialog = closeDialog;
    W.next = next;
    W.prev = prev;

    function load(projectId) {
        // TODO - load
        $timeout(function () {
            if ($state.is('project.details')) {
                // TODO - go to child state
                $state.go('.steps', {step: 1}, {location: 'replace'});
            }
        }, 0);
    }

    function isReached(stepNum) {
        var curNum = Number($stateParams.step);
        return (curNum >= stepNum);
    }

    function openDialog(step) {
        if (!step.enabled) { return; }

        next({to: step});
    }

    function closeDialog(step) {
        step.current = false;
        if (!$state.is('project.details')) {
            // Can be closed already by navigating to next/prev
            $state.go('^');
        }
    }

    function next(param) {
        var step = param.from;
        var nextStep = step ? W.steps[step.idx] : param.to; // zero based
        if (!nextStep) { return; }

        nextStep.current = true;
        if (nextStep.reached) {
            $timeout(function () {
                $state.go(nextStep.state);
            }, 0);
        } else {
            nextStep.reached = true;
            // unlock next after
            var afterStep = W.steps[nextStep.idx];
            if (afterStep) {
                afterStep.enabled = true;
            }

            $timeout(function () {
                $state.go(nextStep.state, {step: nextStep.idx}); // change param = progress
            }, 0);
        }
    }

    function prev(param) {
        var step = param.from;
        var prevStep = W.steps[step.idx-2]; // zero based
        if (prevStep) {
            prevStep.current = true;
        }
        $timeout(function () {
            $state.go(prevStep.state);
        }, 0);
    }

    function progress() {
        var reached = W.steps.reduce(function (prev, next) {
            return prev + (next.reached ? 1 : 0);
        }, 0);
        var percent = (reached / W.steps.length) * 100;
        return percent;
    }

    return W;
}
