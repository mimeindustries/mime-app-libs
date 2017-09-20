module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n',
      },
      mearm: {
        src: ['mimedevice.js', 'mearm.js'],
        dest: 'build/mearm.js',
      },
      mirobot: {
        src: ['mimedevice.js', 'mirobot.js'],
        dest: 'build/mirobot.js',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'build/mearm.min.js': ['build/mearm.js'],
          'build/mirobot.min.js': ['build/mirobot.js']
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'mearm.js']
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task
  grunt.registerTask('default', ['concat:mearm', 'concat:mirobot', 'uglify']);

  grunt.registerTask('test', ['jshint']);
  
};