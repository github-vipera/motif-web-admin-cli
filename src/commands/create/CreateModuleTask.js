/**
 * Created by marcobonati on 30/11/2017.
 */

const ora = require('ora');
const chalk = require('chalk');
const simpleGit = require('simple-git');
const Q = require("q");
const git = require('simple-git/promise');
const tmp = require('tmp');
const path = require('path');
const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const inquirer = require('inquirer');

/**
 *
 * @constructor
 */
function CreateModuleTask(){
}

CreateModuleTask.prototype.runTask= function(commands, args, callback) {

    this.spinner = ora('Creating New Module...').start();

    // Check args
    this.moduleName = args.name;
    this.template = 'default';
    if (args.template){
        //download this template
        this.template = args.template;
    }

    // Get Repo URL from template name
    this.repoPath = this.repoPathForTemplate(this.template);
    if (!this.repoPath){
        let errorMsg = "Unknown module template unknown: '" + this.template+ "'";
        //console.log(chalk.red.bold(errorMsg));
        this.spinner.fail(errorMsg);
        return -1;
    }

    //creating a temporary folder
    this.prepareFolders();
    //console.log("Folders ready");

    this.spinner = this.spinner.start("Cloning from repo " + this.repoPath +"...");

    this.cloneTemplateRepo().then(() => {
        this.spinner = this.spinner.succeed("Module template clone done.");
        this.modifyModule().then(()=>{

            this.moveTempModule();
            this.updateAngularJsonFile();
            this.updateTSConfig();
            //this.runNpmInstall();
            this.spinner = this.spinner.succeed("Creation module done.");
            console.log("");
            console.log(chalk.green.bold("Next steps are:"));
            console.log(chalk.green.bold("> cd ./projects/" + this.moduleName));
            console.log(chalk.green.bold("> npm install "));
            console.log("");
            console.log("Enjoy!");
            console.log("");
            this.cleanTempFolder();
    
        }, (error)=>{
            console.log("Error: ", error);
            console.log("");
            this.cleanTempFolder();
            this.spinner.fail(error);
        });

    }).catch((err) => {
        console.log("Error: ", err);
        console.log("");
        this.cleanTempFolder();
        this.spinner.fail(err);
    });

    //console.log(chalk.red.bold("Executing create module: ",moduleName, template));

}


CreateModuleTask.prototype.updateTSConfig = function() {
    this.spinner = this.spinner.start("Updating TS configuration");

    let tsConfigFile = path.join(".", "tsconfig.json");
    let tsConfig = jsonfile.readFileSync(tsConfigFile);
    
    if (!tsConfig.compilerOptions.paths){
        tsConfig.compilerOptions.paths = {};
    }
    
    tsConfig.compilerOptions.paths[this.moduleName] = ['dist/' + this.moduleName];
    tsConfig.compilerOptions.paths[this.moduleName + '/*'] = ['dist/' + this.moduleName + '/*'];

    jsonfile.writeFileSync(tsConfigFile, tsConfig,   {spaces: 2, EOL: '\r\n'});

    this.spinner = this.spinner.succeed("TS configuration updated.");
}

CreateModuleTask.prototype.updateAngularJsonFile = function() {
    this.spinner = this.spinner.start("Updating console project");
    let jsonAttr = this.createAngularJsonEntry();

    let angularJsonFile = path.join(".", "angular.json");
    let angularJson = jsonfile.readFileSync(angularJsonFile);
    angularJson.projects[this.moduleName] = jsonAttr;
    jsonfile.writeFileSync(angularJsonFile, angularJson,   {spaces: 2, EOL: '\r\n'});

    this.spinner = this.spinner.succeed("Console project updated.");
}

CreateModuleTask.prototype.runNpmInstall = function() {
    //process.chdir('./' + this.moduleName);
    //console.log("Current folder is ", __dirname);
}

// Move the module form the temp folder to the current working dir
CreateModuleTask.prototype.moveTempModule = function() {
    fs.moveSync(this.prjTempFolder, './projects/'+this.moduleName);
}

// Change package.json module name
CreateModuleTask.prototype.modifyModule = function() {

    return new Promise((resolve,reject)=>{
        this.spinner = this.spinner.start("Preparing new module");
    
        // change package json
        let packageJsonFile = path.join(this.prjTempFolder, "package.json");
        let packageJson = jsonfile.readFileSync(packageJsonFile);
        packageJson.name = this.moduleName;
        jsonfile.writeFileSync(packageJsonFile, packageJson,   {spaces: 2, EOL: '\r\n'});
    
        //change ng-package.json 
        let ngPackageJsonFile = path.join(this.prjTempFolder, "ng-package.json");
        let ngPackageJson = jsonfile.readFileSync(ngPackageJsonFile);
        ngPackageJson.dest = "../../dist/" + this.moduleName;
        jsonfile.writeFileSync(ngPackageJsonFile, ngPackageJson,   {spaces: 2, EOL: '\r\n'});

        //change ng-package.prod.json 
        ngPackageJsonFile = path.join(this.prjTempFolder, "ng-package.prod.json");
        ngPackageJson = jsonfile.readFileSync(ngPackageJsonFile);
        ngPackageJson.dest = "../../dist/" + this.moduleName;
        jsonfile.writeFileSync(ngPackageJsonFile, ngPackageJson,   {spaces: 2, EOL: '\r\n'});
        
        this.spinner = this.spinner.succeed("New module prepared.");
        
        resolve();
    });

}

CreateModuleTask.prototype.cleanTempFolder = function() {
    // Manual cleanup
    fs.removeSync(this.tempFolder);
}

CreateModuleTask.prototype.cloneTemplateRepo = function(template) {
    //Clone the repo
    return git().outputHandler((command, stdout, stderr) => {
        //stdout.pipe(process.stdout);
        //stderr.pipe(process.stderr);
    }).clone(this.repoPath, this.prjTempFolder);
}


CreateModuleTask.prototype.prepareFolders = function(template) {
    this.tempFolder = this.createTempFolder();
    //console.log('Temp Folder: ', this.tempFolder);
    this.prjTempFolder = path.join(this.tempFolder, this.moduleName);
}

CreateModuleTask.prototype.createTempFolder = function(template) {
    let tmpobj = tmp.dirSync();
    return tmpobj.name;
}

CreateModuleTask.prototype.repoPathForTemplate = function(template) {

    if (template==='default'){
        return 'https://github.com/github-vipera/web-console-module-template.git';
    } else {
        return undefined;
    }

}

CreateModuleTask.prototype.createAngularJsonEntry = function() {
    let entry = {
        "root": "projects/" + this.moduleName,
        "sourceRoot": "projects/"+this.moduleName+"/src",
        "projectType": "library",
        "prefix": "vp",
        "architect": {
          "build": {
            "builder": "@angular-devkit/build-ng-packagr:build",
            "options": {
              "tsConfig": "projects/"+this.moduleName+"/tsconfig.lib.json",
              "project": "projects/"+this.moduleName+"/ng-package.json"
            },
            "configurations": {
              "production": {
                "project": "projects/"+this.moduleName+"/ng-package.prod.json"
              }
            }
          },
          "test": {
            "builder": "@angular-devkit/build-angular:karma",
            "options": {
              "main": "projects/"+this.moduleName+"/src/test.ts",
              "tsConfig": "projects/"+this.moduleName+"/tsconfig.spec.json",
              "karmaConfig": "projects/"+this.moduleName+"/karma.conf.js"
            }
          },
          "lint": {
            "builder": "@angular-devkit/build-angular:tslint",
            "options": {
              "tsConfig": [
                "projects/"+this.moduleName+"/tsconfig.lib.json",
                "projects/"+this.moduleName+"/tsconfig.spec.json"
              ],
              "exclude": [
                "**/node_modules/**"
              ]
            }
          }
        }
      };
      return entry;
}


// export the class
module.exports = CreateModuleTask;
