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
                files: [
                    'Gruntfile.js',
                    'static/**/*.*'
                ]
            },
            karma: {
                files: ['static/js/**/*.js'],
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
                    specs: ['./static/js/test/e2e/*.js'],
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
        },

        // LESS compiler
        //
        less: {
            dev: {
                options: {
                    paths: ["static/css"]
                },
                files: {
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
                    'index.html',
                    'bower_components/angularjs/angular.{js,min.js,min.js.map}'
                ],
                dest: 'dist/'
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
        'karma:unit:start',
        'watch'
    ]);

    grunt.registerTask('build', [
        'clean',
        'less',
        'copy',
        'useminPrepare',
            'concat',
            'uglify',
            'cssmin',
            'rev',
        'usemin'
    ]);

    grunt.registerTask('prod', ['build']);
    grunt.registerTask('default', ['dev']);
};