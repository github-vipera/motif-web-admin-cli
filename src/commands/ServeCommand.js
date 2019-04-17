/**
 * Created by marcobonati on 04/12/2017.
 */

const ora = require('ora');
const chalk = require('chalk');
var Q = require("q");
const git = require('simple-git/promise');
var tmp = require('tmp');
var path = require('path');
const fs = require('fs-extra')
var jsonfile = require('jsonfile');
const { spawn } = require('child_process');
const runScript = require('runscript');


/**
 *
 * @constructor
 */
function ServeCommand(){
    this.isWin = /^win/.test(process.platform);
}

ServeCommand.prototype.execute = function(commands, args, callback) {

    let cmd = this.prepareCommand("npm");

    this.spinner = ora('Serving Console App...').start();

    const child = spawn(cmd, [ 'run', 'start' ] );

    child.stdout.on('data', (data) => {
        console.log(chalk.green(`${data}`));
    });

    child.stderr.on('data', (data) => {
        console.error(chalk.red(`${data}`));
        //this.spinner.fail('Serving Console App error.');
    });

    child.on('exit', (code, signal) =>{
        console.log('child process exited with ' +
            `code ${code} and signal ${signal}`);
        callback();
        this.spinner.stop();
    });




}


ServeCommand.prototype.prepareCommand = function(cmd) {
    if (this.isWin) {
        cmd = cmd + ".cmd";
    }
    return cmd;
}


// export the class
module.exports = ServeCommand;