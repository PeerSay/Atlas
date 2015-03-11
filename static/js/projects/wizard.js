/*global angular:true*/

angular.module('PeerSay')
    .factory('Wizard', Wizard);

Wizard.$inject = ['$rootScope', '$state', '$stateParams', '$timeout', 'Util', 'Projects'];
function Wizard($rootScope, $state, $stateParams, $timeout, _, Projects) {
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
    W.current = {
        projectId: '',
        stepNum: '1'
    };
    W.load = load;
    W.progress = progress;
    W.isReached = isReached;
    W.openDialog = openDialog;
    W.closeDialog = closeDialog;
    W.next = next;
    W.prev = prev;

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (!$state.includes('**.steps.*')) { return; }

        // Prevent back-step on Back
        if (toParams.step !== W.current.stepNum) {
            event.preventDefault();
            $state.go(toState.name, {step: W.current.stepNum});
        }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        if (!$state.includes('**.details.**')) { return; }

        // Set current
        _.forEach(W.steps, function (step) {
            var re = new RegExp(step.state);
            step.current = re.test(toState.url);
        });
    });

    function load(projectId) {
        W.current.projectId = projectId;
        return Projects.readProjectProgress(projectId)
            .then(function (res) {
                var curStepNum = W.current.stepNum = String(res.result.progress);

                // Set initial reached
                _.forEach(W.steps, function (step) {
                    step.enabled = step.reached = (step.idx <= Number(curStepNum));
                });

                if ($stateParams.step !== curStepNum) {
                    // Fixing step num loaded from server
                    $state.go('project.details.steps', {step: curStepNum}, {location: 'replace'});
                }
            });
    }

    function isReached(stepNum) {
        var curStepNum = Number($stateParams.step);
        return (curStepNum >= stepNum);
    }

    function openDialog(step) {
        if (!step.enabled) { return; }

        next({to: step, openDlg: true});
    }

    function closeDialog(step) {
        if (!$state.is('project.details.steps')) {
            // Can be closed already by navigating Back => then no need to change $state
            $state.go('^');
        }
    }

    function next(param) {
        var fromStep = param.from;
        var nextStep = fromStep ? W.steps[fromStep.idx] : param.to;
        if (!nextStep) { return; }

        var nextUrl = param.openDlg ? nextStep.state : ('^' + nextStep.state);

        if (nextStep.reached) {
            $state.go(nextUrl);
        } else {
            nextStep.reached = true;
            // unlock next after
            var afterStep = W.steps[nextStep.idx];
            if (afterStep) {
                afterStep.enabled = true;
            }

            W.current.stepNum = String(nextStep.idx);
            $state.go(nextUrl, {step: nextStep.idx}); // change param => progress

            Projects.updateProjectProgress(W.current.projectId, {progress: nextStep.idx}); // async!
        }
    }

    function prev(param) {
        var step = param.from;
        var prevStep = W.steps[step.idx-2];
        if (prevStep) {
            $state.go('^' + prevStep.state);
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
