/**
 * Created by marcobonati on 30/11/2017.
 */
const chalk = require('chalk');
var Q = require("q");
const git = require('simple-git/promise');
var tmp = require('tmp');
var path = require('path');
const fs = require('fs-extra')

var CreateModuleTask = require("./create/CreateModuleTask");
var CreateApplicationTask = require("./create/CreateApplicationTask");

/**
 *
 * @constructor
 */
function CreateCommand(){

}

CreateCommand.prototype.execute = function(commands, args, callback) {

    let subCommand = commands[1];

    if (subCommand==='module'){
        return this.executeCreateModule(commands, args, callback);
    }
    else if (subCommand==='application'){
        return this.executeCreateApplication(commands, args, callback);
    }

    return -1;
}

CreateCommand.prototype.executeCreateApplication = function(commands, args, callback) {

    let task = new CreateApplicationTask();
    task.runTask(commands, args, callback);

}

CreateCommand.prototype.executeCreateModule = function(commands, args, callback) {

    //console.log(chalk.red.bold("Executing create module command...",commands, JSON.stringify(args), callback ));

    let task = new CreateModuleTask();
    task.runTask(commands, args, callback);

}





// export the class
module.exports = CreateCommand;