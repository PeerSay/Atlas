angular.module('PeerSay')
    .filter('budget', budget);

budget.$inject = ['$filter', '$parse'];
function budget($filter, $parse) {
    return function (budget, text) {
        /*
         Expects object of format: {
            amount: 10000 | 0,
            currencyLabel: "USD" | ...,
            amountMultiplier: '----' | 'Thousands'
         }
         Possible results are:
          ''
          '<span class="fa fa-usd"></span>10,000'
          '<span class="fa fa-usd"></span>10,000,000' (if 'Thousands')
          '10,000,000 USD' (if text === true)
        */
        var res = '';
        var num = budget.amount;
        var label = $parse('budget.currencyLabel | lowercase')({budget: budget});
        if (num) {
            // Prefix - html!
            if (!text) {
                res += ['<span class="fa fa-', label, '"></span> '].join('');
            }

            // Number
            if (budget.amountMultiplier === 'Thousands') {
                num *= 1000;
            }
            res += $filter('number')(num, 0);

            // Suffix - text!
            if (text) {
                res += ' ' + budget.currencyLabel;
            }
        }

        return res;
    };
}