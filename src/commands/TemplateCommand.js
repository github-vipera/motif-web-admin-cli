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
function TemplateCommand(){

}

TemplateCommand.prototype.execute = function(commands, args, callback) {

    let subCommand = commands[1];

    if (subCommand==='list'){
        return this.executeTemplateList(commands, args, callback);
    }
 
    return -1;
}

TemplateCommand.prototype.executeTemplateList = function(commands, args, callback) {

    let task = new CreateApplicationTask();
    task.runTask(commands, args, callback);

}




// export the class
module.exports = TemplateCommand;