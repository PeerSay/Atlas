module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
        // Config may be useful, eventually
        //cfg: grunt.file.readJSON('config.json'),

        // Watch - monitors changes and runs tasks
        //
        watch: {
            assets: {
                options: {
                    livereload: 35729,
                    spawn: false
                },
                files: [
                    'Gruntfile.js',
                    'static/**/*.*'
                ]
            },

            karma: {
                files: ['static/js/**/*.js'],
                tasks: ['karma:unit:run']
            }
        },

        // Connect - runs web server (might be useful, eventually)
        //
        /*connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: '<%= connect.options.livereload %>'
            },
            serve: {
                options: {
                    open: true,
                    base: [
                        'static/'
                    ]
                }
            }
        }*/

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
                basePath : './static',
                files: [
                    'js/test/**/*.js'
                ],
                exclude: [
                    'js/test/e2e/*.*'
                ],
                frameworks: ['mocha', 'chai']
            },
            // watch mode - runs karma server and lets watch re-run tests
            unit: {
                background: true,
                singleRun: false,
                browsers: ['Chrome']
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
                    specs: ['./static/js/test/e2e/*.js'],
                    baseUrl: 'http://localhost:5000',
                    chromeOnly: true,
                    chromeDriver: 'node_modules/protractor/selenium/chromedriver'
                }
            },
            run: {} // grunt requires at least one task
        },

        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: false,
                boss: true,
                eqnull: true,
                browser: true
            },
            all: ['Gruntfile.js', '*.js', 'static/js/**/*.js']
        }
    });

    grunt.registerTask('test', ['jshint', 'mochaTest', 'karma:continuous']);
    grunt.registerTask('test_e2e', ['protractor:run']);
    grunt.registerTask('dev', ['jshint', 'karma:unit:start', 'watch']); // TODO: less
    grunt.registerTask('prod', ['test']); // TODO: dev + uglify, concat/copy, cssmin
    grunt.registerTask('default', ['dev']);
};
