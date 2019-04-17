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

/**
 *
 * @constructor
 */
function CreateApplicationTask(){
}

CreateApplicationTask.prototype.runTask= function(commands, args, callback) {

    this.spinner = ora('Creating New Wed Admin Application...').start();

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
        let errorMsg = "Unknown application template unknown: '" + this.template+ "'";
        this.spinner.fail(errorMsg);
        return -1;
    }

    //creating a temporary folder
    this.prepareFolders();

    this.spinner = this.spinner.start("Cloning from repo " + this.repoPath +"...");

    this.cloneTemplateRepo().then(status => {
        this.spinner = this.spinner.succeed("Application template cloned.");

        this.spinner = this.spinner.start("Preparing the new application");
        this.modifyModule().then(()=>{
            this.moveTempModule();
            this.runNpmInstall();
            console.log("");
            this.spinner = this.spinner.succeed("Application created successfully.");
            console.log("");
            console.log(chalk.green.bold("Next steps are:"));
            console.log(chalk.green.bold("> cd " + this.applicationName));
            console.log(chalk.green.bold("> npm install "));
            console.log(chalk.green.bold("> ng serve "));
            console.log("");
            console.log("Enjoy!");
            console.log("");
            this.cleanTempFolder();

            this.spinner = this.spinner.succeed("New application ready.");

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



CreateApplicationTask.prototype.runNpmInstall = function() {
    process.chdir('./' + this.applicationName);
    //console.log("Current folder is ", __dirname);
}

// Move the module form the temp folder to the current working dir
CreateApplicationTask.prototype.moveTempModule = function() {
    fs.moveSync(this.prjTempFolder, './'+this.applicationName);
}

// Change package.json module name
CreateApplicationTask.prototype.modifyModule = function() {

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

CreateApplicationTask.prototype.updateHTML = function() {

    return new Promise((resolve,reject)=>{

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
                console.log('Modified files:', changes.join(', '));
                resolve();
            } catch (error) {
                console.error('Error occurred:', error);
                reject(error);
            }
 
        }, (error)=>{
            reject(error);
        });

    });
}

CreateApplicationTask.prototype.loadHTML = function(file) {
    var contents = fs.readFileSync(file, 'utf8');
    const document = parse5.parse(contents);
    return document;
}


CreateApplicationTask.prototype.updateConsoleDescriptorJsonFile = function() {

    return new Promise((resolve,reject)=>{
        // Update the webconsole.descriptor.json file
        let webConsoleDescriptorJsonFile = path.join(this.prjTempFolder, "webconsole.descriptor.json");
        let webConsoleDescriptorJson = jsonfile.readFileSync(webConsoleDescriptorJsonFile);
        webConsoleDescriptorJson.name = this.applicationName;
        webConsoleDescriptorJson.description = this.description;
        jsonfile.writeFileSync(webConsoleDescriptorJsonFile, webConsoleDescriptorJson,   {spaces: 2, EOL: '\r\n'});
        resolve();
    });
}

CreateApplicationTask.prototype.updatePackageJsonFile = function() {

    return new Promise((resolve, reject)=>{

        // Update the package.json file
        let packageJsonFile = path.join(this.prjTempFolder, "package.json");
        let packageJson = jsonfile.readFileSync(packageJsonFile);
        packageJson.name = this.applicationName;
        jsonfile.writeFileSync(packageJsonFile, packageJson,   {spaces: 2, EOL: '\r\n'});
        
        resolve();
    });
}

CreateApplicationTask.prototype.updateAngularJsonFile = function() {

    return new Promise((resolve,reject)=>{

        //Replace all names
        let angularJsonFile = path.join(this.prjTempFolder, "angular.json");
        const options = {
            files: angularJsonFile,
            from: /web-console-template/g,
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

CreateApplicationTask.prototype.updateAngularJsonFileForProxy = function(angularJsonFile) {

    var myPromise = new Promise((resolve, reject)=>{

        var questions = [
            {
                type: 'confirm',
                name: 'proxyEnabled',
                message: 'Do you want to add proxy support in your project?',
                default: false
            },
            {
                type: 'input',
                name: 'proxyIP',
                message: 'Enter the ip address of your MOTIF:',
                when: function(answers) {
                    return answers.proxyEnabled;
                }
            },
            {
                type: 'input',
                name: 'proxyPort',
                message: 'Enter the port number of your MOTIF:',
                when: function(answers) {
                    return answers.proxyEnabled;
                }
            },
            {
                type: 'input',
                name: 'proxyScheme',
                message: 'Enter the URL scheme:',
                default: "http",
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
                    proxyJson["/rest"].target = answers.proxyScheme +"://" + answers.proxyIP + ":" + answers.proxyPort;
                    proxyJson["/oauth"].target = answers.proxyScheme +"://" + answers.proxyIP + ":" + answers.proxyPort;
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

CreateApplicationTask.prototype.cleanTempFolder = function() {
    // Manual cleanup
    fs.removeSync(this.tempFolder);
}

CreateApplicationTask.prototype.cloneTemplateRepo = function(template) {
    //Clone the repo
    /*
    return git().outputHandler((command, stdout, stderr) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
    }).clone(this.repoPath, this.prjTempFolder);
    */   
   return git().clone(this.repoPath, this.prjTempFolder);
}


CreateApplicationTask.prototype.prepareFolders = function(template) {
    this.tempFolder = this.createTempFolder();
    console.log('Temp Folder: ', this.tempFolder);
    this.prjTempFolder = path.join(this.tempFolder, this.applicationName);
}

CreateApplicationTask.prototype.createTempFolder = function(template) {
    let tmpobj = tmp.dirSync();
    return tmpobj.name;
}

CreateApplicationTask.prototype.repoPathForTemplate = function(template) {

    if (template==='default'){
        return 'https://github.com/github-vipera/motif-web-admin-template-project.git';
    } else {
        return undefined;
    }

}


// export the class
module.exports = CreateApplicationTask;
