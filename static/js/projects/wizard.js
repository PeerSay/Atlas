/*global angular:true*/

angular.module('PeerSay')
    .factory('Wizard', Wizard);

Wizard.$inject = ['$state', '$stateParams',  '$timeout', 'Util'];
function Wizard($state, $stateParams, $timeout, _) {
    var W = {};
    W.steps = [
        {
            state: '.essentials',
            name: 'es',
            shortTitle: 'Essentials',
            title: 'Project Essentials',
            enabled: true,
            reached: true,
            current: true
        },
        {
            state: '.requirements',
            name: 're',
            shortTitle: 'Requirements',
            title: 'Project Requirements',
            enabled: true,
            reached: false,
            current: true
        },
        {
            state: '.products',
            name: 'pi',
            shortTitle: 'Products',
            title: 'Product Input',
            enabled: false,
            reached: false,
            current: false
        },
        {
            state: '.shortlist',
            name: 'sh',
            shortTitle: 'Decisions',
            title: 'Shortlist',
            enabled: false,
            reached: false,
            current: false
        }
    ];
    W.load = load;
    W.current = current;
    W.progress = progress;
    W.closeDialog = closeDialog;
    W.next = next;

    function load (projectId) {
        console.log('>>Wizard load', projectId);

        $timeout(function () {
            console.log('>>Wizard load2', $state.current);
            if ($state.is('project.details')) {
                // go to child state
                $state.go('.steps', {step: current()}, {location: 'replace'});
            }
        }, 0);
    }

    function current () {
        // TODO
        return $stateParams.step || 1;
    }

    function next(from) {
        var step = _.findWhere(W.steps, { name: from });
        var stepIdx = W.steps.indexOf(step);
        var nextStep = W.steps[stepIdx + 1];
        if (nextStep) {
            nextStep.reached = true;
            nextStep.current = true;
        }
        var afterStep = W.steps[stepIdx + 2];
        if (afterStep) {
            afterStep.enabled = true;
        }
        var stepNum = stepIdx + 2; // zero based

        $timeout(function () {
            $state.go('^' + nextStep.state, {step: stepNum});
        }, 0);
    }

    function closeDialog() {
        if (!$state.is('project.details')) {
            // Can be closed already by navigating to next/prev
            $state.go('^');
        }
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
