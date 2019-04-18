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
const replaceInFile = require('replace-in-file');
const inquirer = require('inquirer');
const npm = require("npm");

const github_project_url = 'https://github.com/github-vipera/motif-web-admin-module-template-project.git';

/**
 *
 * @constructor
 */
function CreateModuleTask(){
}

CreateModuleTask.prototype.runTask= function(commands, args, callback) {

    this.spinner = ora('Creating New Web Admin Module...').start();

    // Check args
    this.applicationName = args.name;
    this.description = "";
    if (args.description){
        //application description
        this.description = args.description;
    }
    this.template = 'default';
    if (args.template){
        //download this template
        this.template = args.template;
    }

    // Get Repo URL from template name
    this.repoPath = this.repoPathForTemplate(this.template);
    if (!this.repoPath){
        let errorMsg = "Unknown module template unknown: '" + this.template+ "'";
        this.spinner.fail(errorMsg);
        return -1;
    }

    //creating a temporary folder
    this.prepareFolders();

    this.spinner = this.spinner.start("Cloning from repo " + this.repoPath +"...");

    this.cloneTemplateRepo().then(status => {
        this.spinner = this.spinner.succeed("Module template cloned.");

        this.spinner = this.spinner.start("Preparing the new module");
        this.modifyModule().then(()=>{
            this.moveTempModule();
            this.runNpmInstall((err,data)=>{
                if (err){
                    this.spinner = this.spinner.fail("Module creation fail:", err);
                } else {
                    console.log("");
                    this.spinner = this.spinner.succeed("Module created successfully.");
                    console.log("");
                    console.log(chalk.green.bold("Next steps are:"));
                    console.log(chalk.green.bold("> cd " + this.applicationName));
                    console.log(chalk.green.bold("> ng build "+ this.applicationName));
                    console.log(chalk.green.bold("> ng serve "));
                    console.log("");
                    console.log("Enjoy!");
                    console.log("");
        
                    this.spinner = this.spinner.succeed("New module ready.");
                }
                this.cleanTempFolder();
            });

        }, (error)=>{

            console.log(chalk.red.bold("Error: ", error));
            console.log("");
            this.cleanTempFolder();
            this.spinner.fail(err);

        });
        

    }).catch(err => {
        console.log(chalk.red.bold("Error: ", err));
        console.log("");
        this.cleanTempFolder();
        this.spinner.fail(err);
    });

    //console.log(chalk.red.bold("Executing create module: ",moduleName, template));

}



CreateModuleTask.prototype.runNpmInstall = function(callback) {
    console.log("Installing dependencies...");
    process.chdir('./' + this.applicationName);
    npm.load(function(err) {
        // handle errors
      
        // install module ffi
        npm.commands.install([], function(er, data) {
            callback(er, data);
        });
      
        npm.on('log', function(message) {
          // log installation progress
          console.log(message);
        });
      });
    //console.log("Current folder is ", __dirname);
}

// Move the module form the temp folder to the current working dir
CreateModuleTask.prototype.moveTempModule = function() {
    fs.moveSync(this.prjTempFolder, './'+this.applicationName);
}

// Change package.json module name
CreateModuleTask.prototype.modifyModule = function() {

    return new Promise((resolve, reject)=>{

        this.updatePackageJsonFile().then(()=>{

            // Update the angular.json file
            this.updateAngularJsonFile().then(()=>{

                // Update the Application Descriptor JSON file 
                this.updateConsoleDescriptorJsonFile().then(()=>{
                    
                    this.updateHTML().then(()=>{
                        resolve();
                    }, (error)=>{
                        reject(error);
                    });

                }, (error)=>{
                    reject(error);
                });
    
            }, (error)=>{
                reject(error);
            })     
    
        }, (error)=>{
            reject(error);
        });
    
    });


}

CreateModuleTask.prototype.updateHTML = function() {

    return new Promise((resolve,reject)=>{
        resolve();
        /*
        var questions = [
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of your new console:'
            }
        ];

        this.spinner = this.spinner.stop();

        inquirer.prompt(questions).then( (answers) => {

            //update the HTML content
            let indexHtmlFile = path.join(this.prjTempFolder, "src", "index.html");
            const options = {
                files: indexHtmlFile,
                from: '<title>Demo</title>',
                to: '<title>'+answers.title+'</title>',
            };
            try {
                const changes = replaceInFile.sync(options);
                //console.log('Modified files:', changes.join(', '));
                resolve();
            } catch (error) {
                console.error('Error occurred:', error);
                reject(error);
            }
 
        }, (error)=>{
            reject(error);
        });
        */

    });
}

CreateModuleTask.prototype.loadHTML = function(file) {
    var contents = fs.readFileSync(file, 'utf8');
    const document = parse5.parse(contents);
    return document;
}


CreateModuleTask.prototype.updateConsoleDescriptorJsonFile = function() {

    return new Promise((resolve,reject)=>{
        resolve();
        /*
        // Update the webconsole.descriptor.json file
        let webConsoleDescriptorJsonFile = path.join(this.prjTempFolder, "webconsole.descriptor.json");
        let webConsoleDescriptorJson = jsonfile.readFileSync(webConsoleDescriptorJsonFile);
        webConsoleDescriptorJson.name = this.applicationName;
        webConsoleDescriptorJson.description = this.description;
        jsonfile.writeFileSync(webConsoleDescriptorJsonFile, webConsoleDescriptorJson,   {spaces: 2, EOL: '\r\n'});
        resolve();
        */
    });
}

CreateModuleTask.prototype.updatePackageJsonFile = function() {

    return new Promise((resolve, reject)=>{

        // Update the package.json file
        let packageJsonFile = path.join(this.prjTempFolder, "package.json");
        let packageJson = jsonfile.readFileSync(packageJsonFile);
        packageJson.name = this.applicationName;
        jsonfile.writeFileSync(packageJsonFile, packageJson,   {spaces: 2, EOL: '\r\n'});
        
        resolve();
    });
}

CreateModuleTask.prototype.updateAngularJsonFile = function() {

    return new Promise((resolve,reject)=>{

        //Replace all names
        let angularJsonFile = path.join(this.prjTempFolder, "angular.json");
        let options = {
            files: angularJsonFile,
            from: /motif-web-admin-template-project/g,
            to: this.applicationName,
        };
        try {
            const changes = replaceInFile.sync(options);
            console.log('Modified files:', changes.join(', '));
        } catch (error) {
            console.error('Error occurred:', error);
            reject(error);
        }
       
        // Enable Proxy if needed
        this.updateAngularJsonFileForProxy().then(()=>{
            resolve();
        }, (error)=>{
            reject(error);
        });

    });

}

CreateModuleTask.prototype.updateAngularJsonFileForProxy = function(angularJsonFile) {

    var myPromise = new Promise((resolve, reject)=>{

       var questions = [
        {
            type: 'confirm',
            name: 'proxyEnabled',
            message: 'Do you want to add proxy support in your project?',
            default: true
        },
        {
            type: 'input',
            name: 'proxyURL',
            message: 'Enter the URL address of your MOTIF:',
            when: function(answers) {
                return answers.proxyEnabled;
            }
        }
    ];


        this.spinner = this.spinner.stop();

        inquirer.prompt(questions).then( (answers) => {

            try {
                if (answers.proxyEnabled){
                    
                    // Update the json file
                    let packageJsonFile = path.join(this.prjTempFolder, "angular.json");
                    let packageJson = jsonfile.readFileSync(packageJsonFile);

                    packageJson.projects[this.applicationName].architect.serve.options["proxyConfig"] = "./proxy.conf.json";
                    jsonfile.writeFileSync(packageJsonFile, packageJson,   {spaces: 2, EOL: '\r\n'});

                    // Update proxy settings
                    let proxyJsonFile = path.join(this.prjTempFolder, "proxy.conf.json");
                    let proxyJson = jsonfile.readFileSync(proxyJsonFile);

                   proxyJson["\/rest"].target = answers.proxyURL;
                   proxyJson["\/oauth2"].target = answers.proxyURL;
                   jsonfile.writeFileSync(proxyJsonFile, proxyJson,   {spaces: 2, EOL: '\r\n'});

                } else {

                    //do nothings
                }

                resolve();
                
            } catch (ex){
                console.error('Error occurred:', ex);
                this.spinner = this.spinner.fail("Error: " + ex);
                reject(ex);
            }
        });
    
    });

    return myPromise;

}

CreateModuleTask.prototype.cleanTempFolder = function() {
    // Manual cleanup
    fs.removeSync(this.tempFolder);
}

CreateModuleTask.prototype.cloneTemplateRepo = function(template) {
    //Clone the repo
    /*
    return git().outputHandler((command, stdout, stderr) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
    }).clone(this.repoPath, this.prjTempFolder);
    */   
   return git().clone(this.repoPath, this.prjTempFolder);
}


CreateModuleTask.prototype.prepareFolders = function(template) {
    this.tempFolder = this.createTempFolder();
    //console.log('Temp Folder: ', this.tempFolder);
    this.prjTempFolder = path.join(this.tempFolder, this.applicationName);
}

CreateModuleTask.prototype.createTempFolder = function(template) {
    let tmpobj = tmp.dirSync();
    return tmpobj.name;
}

CreateModuleTask.prototype.repoPathForTemplate = function(template) {

    if (template==='default'){
        return github_project_url;
    } else {
        return undefined;
    }

}


// export the class
module.exports = CreateModuleTask;
