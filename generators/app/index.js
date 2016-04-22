'use strict';
var Promise = require('bluebird');
var childProcess = require('child_process');
var s = require('underscore.string');
var fs = require('fs');
var rimraf = require('rimraf');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var versions = [
  'master',
  '1.0.2'
];
var exec = function (cmd) {
  return new Promise(function (resolve, reject) {
    childProcess.exec(cmd, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

var version, folder, folderPath, https;

module.exports = yeoman.Base.extend({

  init: function () {
    console.log(chalk.green('You\'re using the Restify API generator'));

    this.on('end', function () {
      if (!this.options['skip-install']) {
        console.log(chalk.green('Running `npm install`...'));
        exec('cd ' + folder + ' && npm install')
          .then(function () {
            console.log('');
            console.log(chalk.green('------------------------------'));
            console.log(chalk.green('Your restify api is ready!'));
            if (https) {
              console.log(chalk.green('You\'ll need to generate ssl certs by running `bash generate-ssl-certs.sh`'));
            }
            console.log(chalk.green('To get started run `npm start`.'));
            console.log(chalk.green('------------------------------'));
            console.log('');
          });
      }
    });
  },

  checkForGit: function () {
    var done = this.async();

    exec('git --version')
      .then(function () {
        done();
      })
      .catch(function (err) {
        console.log(chalk.red(new Error(err)));
        return;
      });
  },

  promptForVersion: function () {
    var done = this.async();

    var choices = versions.map(function (version) {
      return version;
    });

    this.prompt({
      type: 'list',
      name: 'version',
      message: 'Which restify-api version would you like to generate?',
      choices: choices,
      default: 1
    }, function (props) {
      version = props.version;
      done();
    }.bind(this));
  },

  promptForFolder: function () {
    var done = this.async();

    this.prompt({
      name: 'folder',
      message: 'In which folder would you like the project to be generated? This can be changed later.',
      default: 'restify-api'
    }, function (props) {
      folder = props.folder;
      folderPath = './' + folder + '/';
      done();
    }.bind(this));
  },

  cloneRepo: function () {
    var done = this.async();

    console.log(chalk.green('Cloning restify-api repo...'));

    exec('git clone --branch ' + version + ' https://Benj0s@bitbucket.org/Benj0s/restify-api.git ' + folder)
      .then(function () {
        rimraf(folderPath + '.git', function (error) {
          if (error) {
            console.log(chalk.red('Error: ', error));
          }
        });
        done();
      })
      .catch(function (err) {
        console.log(chalk.red(err));
        return;
      });
  },

  getPrompts: function () {
    var done = this.async();
    var prompts = [{
      name: 'appName',
      message: 'What would you like to call your application?',
      default: 'restify-api'
    }, {
      name: 'appDescription',
      message: 'How would you describe your application?',
      default: 'Restify based api'
    }, {
      name: 'appKeywords',
      message: 'How would you describe your application in comma seperated key words?',
      default: 'Restify,NPM scripts'
    }, {
      name: 'appAuthor',
      message: 'What is your company/author name?'
    }, {
      name: 'appHttps',
      type: 'boolean',
      message: 'Would you like to enable https?',
      default: true
    }];

    this.prompt(prompts, function (props) {
      this.appName = props.appName;
      this.appDescription = props.appDescription;
      this.appKeywords = props.appKeywords;
      this.appAuthor = props.appAuthor;
      https = props.appHttps;

      this.slugifiedAppName = s(this.appName).slugify().value();
      this.humanizedAppName = s(this.appName).humanize().value();
      this.capitalizedAppAuthor = s(this.appAuthor).capitalize().value();

      done();
    }.bind(this));
  },

  replacePackageConfigs: function () {
    var done = this.async();

    var packageJson = JSON.parse(fs.readFileSync(folderPath + 'package.json'));

    packageJson.name = this.slugifiedAppName;
    packageJson.description = this.appDescription;
    packageJson.author = this.appAuthor;
    packageJson.keywords = this.appKeywords;

    fs.writeFile(folderPath + 'package.json', JSON.stringify(packageJson, null, 2), function (err) {
      if (err) {
        return console.log(chalk.red(err));
      }
      done();
    });
  },

  createEnvFile: function () {
    var done = this.async();

    var envFile = JSON.parse(fs.readFileSync(folderPath + '.env.example'));

    envFile.app.server.name = this.slugifiedAppName;
    envFile.app.server.https = https;

    fs.writeFile(folderPath + '.env', JSON.stringify(envFile, null, 2), function (err) {
      if (err) {
        return console.log(chalk.red(err));
      }
      done();
    });
  }

});
