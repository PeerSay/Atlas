var path = require('path');

module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.registerMultiTask('fixSourceMap', 'Fixes incorrect source map generated by usemin/rev combo', function () {
        grunt.verbose.write("Source maps in fixation process");

        var name = this.target;
        var minRe = new RegExp('\\.' + name + '\\.js$');
        var mapRe = new RegExp(name + '\\.js\\.map$');
        var mapFile, minFileName;

        this.files.forEach(function (f) {
            if (minRe.test(f.dest)) {
                minFileName = path.basename(f.dest);
                //grunt.log.writeln(">> Min found: " + minFileName);

            }
            if (mapRe.test(f.dest)) {
                mapFile = f.dest;
                //grunt.log.writeln(">> Map found: " + mapFile);
            }
        });

        if (!mapFile) {
            grunt.fail.warn('Map file "' + mapFile + '" not found.');
        }
        if (!minFileName) {
            grunt.fail.warn('Min file "' + minFileName + '" not found.');
        }

        // Fixing...
        var json = grunt.file.readJSON(mapFile);
        json.file = minFileName;
        json.sources = [name + '.js'];
        grunt.file.write(mapFile, JSON.stringify(json));

        grunt.log.writeln('Source map in ' + mapFile + ' fixed');
    });


    grunt.initConfig({
        // Config may be useful, eventually
        //cfg: grunt.file.readJSON('config.json'),

        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>*/\n',

        // Watch - monitors changes and runs tasks
        //
        watch: {
            assets: {
                options: {
                    livereload: 35729,
                    spawn: false
                },
                files: ['Gruntfile.js', 'static/**/*.*']
            },
            karma: {
                files: ['static/js/**/*.js', 'static/test/**/*.js'],
                tasks: ['karma:unit:run']
            },
            css: {
                files: ['static/css/**/*.less'],
                tasks: ['less']
            }
        },

        // Tests - server
        //
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },

        // Tests - client (unit)
        //
        karma: {
            options: {
                basePath: './static',
                files: [
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/angular/angular.js',
                    'bower_components/angular-route/angular-route.js',
                    'bower_components/angular-messages/angular-messages.js',
                    'bower_components/angular-mocks/angular-mocks.js',
                    'bower_components/angular-sanitize/angular-sanitize.js',
                    'bower_components/ng-table/ng-table.min.js',
                    'bower_components/ng-table-resizable-columns/ng-table-resizable-columns.src.js',
                    'bower_components/angular-elastic/elastic.js',
                    'bower_components/ng-context-menu/dist/ng-context-menu.js',
                    'bower_components/fast-json-patch/dist/json-patch-duplex.min.js',
                    'bower_components/angular-ui-router/release/angular-ui-router.min.js',
                    'js/**/*.js',
                    'test/**/*.js'
                ],
                exclude: [
                    'test/e2e/*.*'
                ],
                frameworks: ['mocha', 'chai', 'sinon-chai']
            },
            // watch mode - runs karma server and lets watch re-run tests
            unit: {
                background: true,
                singleRun: false,
                browsers: ['PhantomJS']
            },
            // continuous integration mode: run tests once in PhantomJS and browsers.
            continuous: {
                singleRun: true,
                browsers: ['PhantomJS', 'Chrome']
            }
        },

        // Tests - client (e2e)
        //
        protractor: {
            options: {
                configFile: "node_modules/protractor/docs/referenceConf.js", // Default config file
                keepAlive: false,
                args: {
                    /*seleniumAddress: 'http://localhost:4444/wd/hub',*/
                    specs: ['static/test/e2e/*.js'],
                    baseUrl: 'http://localhost:5000',
                    chromeOnly: true,
                    chromeDriver: 'node_modules/protractor/selenium/chromedriver'
                }
            },
            run: {} // grunt requires at least one task
        },

        // Verify the quality of JavaScript code
        //
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: false,
                newcap: false,
                noarg: true,
                sub: true,
                undef: false,
                boss: true,
                eqnull: true,
                browser: true,
                shadow: true
            },
            all: ['Gruntfile.js', '*.js', 'static/js/**/*.js', 'static/test/**/*.js']
        },

        // LESS compiler
        //
        less: {
            dev: {
                options: {
                    paths: ["static/css"]
                },
                files: {
                    "static/css/index.css": "static/css/index.less",
                    "static/css/app.css": "static/css/app.less",
                    "static/css/tpl.css": "static/css/tpl.less"
                }
            }
        },

        // Copy all non-transformed files
        //
        copy: {
            all: {
                expand: true,
                cwd: 'static/',
                src: [
                    'html/*.html',
                    'tpl/*.html',
                    'fonts/{,*/}*.{eot,otf,ttf,woff,woff2}',
                    'images/{,*/}*.{png,jpg,gif}'
                ],
                dest: 'dist/'
            },
            map: {
                files: {
                    'dist/js/app.js': './.tmp/concat/js/app.js',
                    'dist/js/index.js': './.tmp/concat/js/index.js'
                }
            },
            noRev: {
                files: {
                    'dist/css/tpl.css': 'static/css/tpl.css'
                }
            }
        },

        // Replace comments in HTML with code (for ga.js, mixpanel, etc.)
        //
        htmlbuild: {
            dist: {
                src: 'static/*.html',
                dest: 'dist/',
                options: {
                    parseTag: 'htmlbuild', // avoid conflict with usemin
                    scripts: {
                        gaLoad: ['static/ga-load.js'],
                        gaTrack: ['static/ga-track.js'],
                        mixpanel: ['static/mixpanel.js']
                    },
                    sections: {
                        GoogleRemarketing: ['static/GoogleRemarketing.html']
                    }
                }
            }
        },

        // Replace several loaded resources in HTML to single include
        //
        useminPrepare: {
            html: ['static/index.html', 'static/app.html']
        },

        usemin: {
            html: ['dist/*.html']
        },

        // Minify concat-ed file
        //
        uglify: {
            options: {
                sourceMap: true,
                banner: '<%= banner %>'
            }
            // paths are added by usemin automatically
        },

        // Fix source maps (our custom task)
        //
        fixSourceMap: {
            app: {
                expand: true,
                cwd: 'dist/js',
                src: ['*.*'],
                dest: 'dist/js'
            },
            index: {
                expand: true,
                cwd: 'dist/js',
                src: ['*.*'],
                dest: 'dist/js'
            }
        },

        // Asset revisions - allow long caches
        //
        rev: {
            files: {
                src: ['dist/**/*.{js,css}', '!dist/bower_components/**']
            }
        },

        // Clean up build artifacts
        //
        clean: {
            all: [
                './dist/*',
                './.tmp/',
                'static/css/*.css'
            ]
        }
    });

    grunt.registerTask('test', [
        'jshint',
        'mochaTest',
        'karma:continuous'
    ]);

    grunt.registerTask('test_e2e', ['protractor:run']);

    grunt.registerTask('dev', [
        'less',
        'watch'
    ]);

    grunt.registerTask('karma-watch', [
        'karma:unit:start',
        'watch:karma'
    ]);

    grunt.registerTask('build', [
        'clean',
        'less',
        'copy:all',
        'htmlbuild',
        'useminPrepare',
            'concat',
            'uglify',
            'cssmin',
            'rev',
            'copy:map',
            'copy:noRev',
        'usemin',
        'fixSourceMap'
    ]);

    grunt.registerTask('prod', ['build']); // TODO: security, performance
    grunt.registerTask('default', ['dev']);
};
