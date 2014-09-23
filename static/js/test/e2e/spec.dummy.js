
describe('Peersay homepage', function() {
    it('should have a title', function() {
        browser.get('http://localhost:5000/');

        expect(browser.getTitle()).toEqual('PeerSay - MVP');
    });
});