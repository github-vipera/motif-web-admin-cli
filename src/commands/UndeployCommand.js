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
var EasyZip = require('easy-zip').EasyZip;
var unirest = require('unirest');
var async = require("async");


/**
 *
 * @constructor
 */
function UndeployCommand(){

}

UndeployCommand.prototype.execute = function(commands, args, callback) {


    this.spinner = ora('Undeployng Console App...').start();

    this.commandArgs = args;
    this.remoteHost = this.commandArgs["remote-host"];

    let descriptorFileExists = fs.existsSync("./webconsole.descriptor.json");
    if (!descriptorFileExists){
        this.spinner.fail("'webconsole.descriptor.json' file not found.");
        return -1;
    }

    this.readDescriptor();

    this.spinner = this.spinner.start('Un-publishing Console App...');
    this.unpublishRemote((success)=>{
        this.spinner = this.spinner.succeed("Un-publish done.");
        this.spinner = this.spinner.start('Removing remotely...');
        this.removeRemote((succ)=>{
            callback();
        }, (fail)=>{
            callback();
        });
    }, (error)=>{
        console.err(error);
        this.spinner = this.spinner.fail("Un-publishing error: " + error);
        this.spinner = this.spinner.start('Removing remotely...');
        this.removeRemote((succ)=>{
            callback();
        }, (fail)=>{
            callback();
        });
    });

    /*
    this.createZip((zipFileName)=>{
        this.spinner = this.spinner.succeed("Distribution file ready " + zipFileName);
        if (!this.commandArgs.offline){
            this.remoteHost = this.commandArgs["remote-host"];
            this.deployRemote(zipFileName, (success)=>{
                if (this.commandArgs.publish){
                    this.publishRemote((success)=>{
                        callback();
                    }, (failure)=>{
                        callback();
                    });
                } else {
                    callback();
                }
            }, (failure)=>{
                callback();
            });
        } else {
            this.spinner = this.spinner.succeed("Deploy done.");
        }
    }, (error)=>{
        console.err(error);
        this.spinner = this.spinner.fail("Preparing distribution file error: " + error);
        return -1;
    });
    */

    return 0;
}

UndeployCommand.prototype.readDescriptor = function() {
    this.spinner = this.spinner.start("Reading descriptor file");
    let webConsoleDescriptorJsonFile = path.join( ".", "webconsole.descriptor.json");
    this.descriptor = jsonfile.readFileSync(webConsoleDescriptorJsonFile);
    this.spinner = this.spinner.succeed("The descriptor file has been read.");
}

UndeployCommand.prototype.createZip = function(success, error) {

    this.spinner = this.spinner.start("Creating distribution file");

    this.remoteHost = this.commandArgs["remote-host"];

    var self = this;

    //move temporarily the  "webconsole.descriptor.json" to ./dist
    try {
        fs.copySync('./webconsole.descriptor.json', './dist/webconsole.descriptor.json')
    } catch (err) {
        error(err);
        return;
    }

    var zip = new EasyZip();
    zip.zipContentFolder('./dist',function(){
        let zipFileName = self.descriptor.name + "_" + self.descriptor.version +".zip";
        zip.writeToFile('./' + zipFileName, (ok)=>{
            success(zipFileName);
        });
    });

}

UndeployCommand.prototype.removeRemote = function(success, failure) {


    this.spinner = this.spinner.start("Deploying remotely to " + this.remoteHost);

    try {

        let remoteUrl = this.remoteHost + '/rest/webcont/bundle/upload';

        unirest.post(remoteUrl)
            .header({ 'Accept' : 'application/json' }, {'Content-Type': 'application/x-www-form-urlencoded'})
            .auth({
                user: this.commandArgs.user,
                pass: this.commandArgs.passwd,
                sendImmediately: true
            })
            .form( { 'name': this.descriptor.name,
                'version' : this.descriptor.version
            })
            .end((response) => {
                if (response.error){
                    this.spinner = this.spinner.fail("Remote un-deploy failure: " + response.error);
                    failure(response.error);
                } else {
                    this.spinner = this.spinner.succeed("Remote un-deploy done.");
                    success();
                }
            });

    } catch (ex){
        this.spinner = this.spinner.fail("Remote un-deploy failure: " + ex);
        failure(ex);
    }

}

UndeployCommand.prototype.unpublishRemote = function(success, failure) {

    this.spinner = this.spinner.start("Un-publishing remotely from " + this.remoteHost);

    try {

        let remoteUrl = this.remoteHost + '/rest/webcont/bundle/unpublish';

        unirest.post(remoteUrl)
            .header({ 'Accept' : 'application/json' }, {'Content-Type': 'application/x-www-form-urlencoded'})
            .auth({
                user: this.commandArgs.user,
                pass: this.commandArgs.passwd,
                sendImmediately: true
            })
            .form( { 'name': this.descriptor.name,
                'version' : this.descriptor.version
            })
            .end((response) => {
                if (response.error){
                    if (response.body && response.body.Details){
                        var code = "";
                        if (response.body.Code){
                            code = "[" + response.body.Code +"]";
                        }
                        this.spinner = this.spinner.fail("Remote un-publishing failure: " + code + " " + response.body.Details);
                    } else {
                        this.spinner = this.spinner.fail("Remote un-publishing failure.");
                        console.log("Response error: ", response);
                    }
                    failure(response.error);
                } else {
                    this.spinner = this.spinner.succeed("Remote un-publishing done.");
                    success();
                }
            });

    } catch (ex){
        this.spinner = this.spinner.fail("Remote un-publishing failure: " + ex);
        failure(ex);
    }

}


EasyZip.prototype.zipContentFolder = function(folder, callback, options) {
    if(!fs.existsSync(folder)){
        callback(new Error('Folder not found'),me);
    }else{
        options = options || {};
        var me = this,
            files = fs.readdirSync(folder),
            rootFolder = options.rootFolder || path.basename(folder),
            zips = [],
            file,stat,targetPath,sourcePath;

        while(files.length > 0){
            file = files.shift();
            sourcePath = path.join(folder,file);
            targetPath = file;
            stat = fs.statSync(sourcePath);

            if(stat.isFile()){
                zips.push({
                    target : targetPath,
                    source : sourcePath
                });
            }else{
                zips.push({
                    target : targetPath
                });

                //join the path
                async.map(fs.readdirSync(sourcePath),function(item,callback){
                    callback(null,path.join(file,item));
                },function(erro,result){
                    files = files.concat(result);
                });

            }
        }

        me.batchAdd(zips,function(){callback(null,me)});

    }
}





// export the class
module.exports = UndeployCommand;