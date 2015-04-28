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
    W.isReached = isReached;
    W.openDialog = openDialog;
    W.closeDialog = closeDialog;
    W.next = next;
    W.prev = prev;

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        //console.log('!!! $stateChangeStart: from=[%s] to=[%s]', fromState.name, toState.name);

        if ($state.includes('**.steps.*')) {
            // Prevent back-step on Back
            if (toParams.step !== W.current.stepNum) {
                event.preventDefault();
                $state.go(toState.name, {step: W.current.stepNum});
            }
        }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        //console.log('!!! $stateChangeSuccess: from=[%s] to=[%s]', fromState.name, toState.name);

        if ($state.includes('**.details.**')) {
            // Sync 'current' prop with state
            _.forEach(W.steps, function (step) {
                var re = new RegExp(step.state);
                step.current = re.test(toState.url);
            });
        }
    });

    function load(projectId) {
        W.current.projectId = projectId;

        return Projects.readProjectProgress(projectId)
            .then(function (res) {
                W.current.stepNum = String(res.result.progress);

                initSteps();

                return W.current;
            });
    }

    function initSteps() {
        var curStepNum = Number(W.current.stepNum);

        // Set initial reached & enabled props
        _.forEach(W.steps, function (step) {
            step.reached = (step.idx <= curStepNum);
            if (step.reached) {
                // Enable this & next
                step.enabled = (W.steps[step.idx] || {}).enabled = true;
            }
        });
    }

    function isReached(stepNum) {
        var curStepNum = Number($stateParams.step);
        return (curStepNum >= stepNum);
    }

    function openDialog(step, field) {
        if (!step.enabled) { return; }

        next({to: step, child: true}, {edit: field});
    }

    function closeDialog() {
        if (!$state.is('project.details.steps')) {
            // Can be closed already by navigating Back => then no need to change $state
            $state.go('^');
        }
    }

    function next(spec, param) {
        var fromStep = spec.from;
        var nextStep = fromStep ? W.steps[fromStep.idx] : spec.to;
        if (!nextStep) { return; }

        var nextUrl = spec.child ? nextStep.state : ('^' + nextStep.state);

        if (nextStep.reached) {
            $state.go(nextUrl, param || {});
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

    return W;
}
