Atlas
=====

The PeerSay MVP project

Notes on Git
==========

### Git branches:
 
 - `master` (default) - *production* branch. Do not use for development, use only for production deploy by merging `dev` branch into it. Note: pushing to it automatically deploys to Heroku.
 
 - `dev` - *staging* branch. Used to accumulate features commits and deploy to staging. Occasional hot-fixes can be committed directly to `dev`. Should *not* diverge from `master` for long time.
 
 - `feature-<name of the feature, poc, test>` - *feature* branches. Create new branch any time you work on a feature/bug-fix/poc/anything. Merge to `dev` and remove branch when done.


### Git workflow

Simplified, the workflow is the following:


    1.  git clone http://yourserver.com/~you/proj.git // time passes..
    2.  git pull
    3.  git diff HEAD^
    4.  git checkout -b bad-feature // work some time..
    5.  git commit -a -m "Created a bad feature"
    6.  git checkout dev
    7.  git pull
    8.  git merge --no-ff bad-feature
    9.  git commit -a
    10. git diff HEAD^ // run tests.. failure!
    11. git reset --hard ORIG_HEAD
    12. git checkout bad-feature // fix bug..
    13. git -m bad-feature good-feature
    14. git commit -a -m "Better feature"
    15. git checkout dev
    16. git pull	 
    17. git merge --no-ff good-feature
    18. git push
    19. git branch -d good-feature
    20. git push origin :good-feature // remove remote
    
When feature branch should be shared between developers:

    First dev:
    1. git checkout -b feature-needs-2-devs // create local branch
    2. git commit -a -m "commit locally to save points of work"
    3. git push -u origin feature-needs-2-devs // push & create upstream link
                                               // if forgot -u, can fix later with:
       git branch --set-upstream feature-needs-2-devs origin/feature-needs-2-devs
    4. git push / git pull // works without params because of -u,
                           // push also requires 'git config --global push.default upstream')
    
    Second dev:
    5. git checkout -t origin/feature-needs-2-devs // -t creates link
    6. git commit -a -m "local commit"
    7. git pull / git push // also works without params due to link


    Push to master (deply to production!):
    1. git checkout master
    2. git pull		// Get changes to your peers
    3. git merge --no-ff dev
    4. git push		// This deploys to production Heroku app due to integration
    5. Go to http://www.peer-say.com/

Note: please don't do `git push heroku master` anymore, this is discouraged after Github repo is connected to Heroku app!
See this: https://devcenter.heroku.com/articles/github-integration#faq
