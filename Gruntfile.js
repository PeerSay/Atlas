module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

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
                    'test/**/*.js'
                ],
                exclude: [
                    'test/e2e/*.*'
                ],
                frameworks: ['mocha', 'chai']
            },
            // watch mode - runs karma server and lets watch re-run tests
            unit: {
                background: true,
                singleRun: false,
                browsers: ['PhantomJS']
            },
            // continuous integration mode: run tests once in PhantomJS browser.
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
                browser: true
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
                    "static/css/public.css": "static/css/public.less",
                    "static/css/app.css": "static/css/app.less"
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
                    'bower_components/angular/angular.{js,min.js,min.js.map}',
                    'bower_components/angular-route/angular-route.{js,min.js,min.js.map}',
                    'bower_components/socket.io-client/socket.io.{js,min.js,min.js.map}',
                    'bower_components/bootstrap/dist/css/bootstrap.{css,min.css,min.css.map}',
                    'bower_components/bootstrap/dist/fonts/*.*'
                ],
                dest: 'dist/'
            }
        },

        // Replace comments in HTML with code (for ga.js)
        //
        htmlbuild: {
            dist: {
                src: 'static/*.html',
                dest: 'dist/',
                options: {
                    parseTag: 'htmlbuild', // avoid conflict with usemin
                    scripts: {
                        ga: ['static/ga.js']
                    }
                }
            }
        },

        // Replace several loaded resources in HTML to single include
        //
        useminPrepare: {
            html: 'static/index.html'
        },

        usemin: {
            html: ['dist/index.html']
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
            all: ['./dist/*', './tmp']
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
/*        'karma:unit:start',*/
        'watch'
    ]);

    grunt.registerTask('build', [
        'clean',
        'less',
        'copy',
        'htmlbuild',
        'useminPrepare',
            'concat',
            'uglify',
            'cssmin',
            'rev',
        'usemin'
    ]);

    grunt.registerTask('prod', ['build']); // TODO: security, performance
    grunt.registerTask('default', ['dev']);
};
