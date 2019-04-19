/**
 * Created by marcobonati on 29/11/2017.
 */

const chalk = require('chalk');
var path = require('path');
var Q = require('q');
var nopt = require('nopt');
var help = require('./help');
var CreateCommand = require('./commands/CreateCommand');
var DeployCommand = require('./commands/DeployCommand');
var ServeCommand = require('./commands/ServeCommand');
var UndeployCommand = require('./commands/UndeployCommand');
var TestCommand = require('./commands/TestCommand');
const emotikon = require('./emoji.json');

var figlet = require('figlet');

const updateNotifier = require('update-notifier');
const pkg = require('../package.json');


module.exports = function (inputArgs, cb) {


};

module.exports = function (inputArgs, cb) {

    /**
     * mainly used for testing.
     */
    cb = cb || function () {
    };

    // If no inputArgs given, use process.argv.
    inputArgs = inputArgs || process.argv;
    var cmd = inputArgs[2]; // e.g: inputArgs= 'node wadmin createmodule'
    var subcommand = getSubCommand(inputArgs, cmd);
    var isTelemetryCmd = (cmd === 'telemetry');
    var isConfigCmd = (cmd === 'config');

    if (cmd === '--version' || cmd === '-v') {
        cmd = 'version';
    } else if (!cmd || cmd === '--help' || cmd === 'h') {
        cmd = 'help';
    }

    figlet('Motif Web Admin CLI', function(err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data)
        cli(inputArgs, cb);
    });


}


function cli (inputArgs, cb) {

    var args = nopt(knownOpts, shortHands, inputArgs);

    process.on('uncaughtException', function (err) {
        if (err.message) {
            console.error("FATAL ERROR: " + err.message, err);
        } else {
            console.error("FATAL ERROR ", err);
        }
        process.exit(1);
    });

    var cliVersion = require('../package').version;

    console.log('');
    console.log(chalk.blue.bold("MOTIF Web Admin CLI - Vipera © 2017-2019"));
    console.log(chalk.blue("Version " , cliVersion), emotikon.herb);
    console.log('');


    // If there were arguments protected from nopt with a double dash, keep
    // them in unparsedArgs. For example:
    // cordova build ios -- --verbose --whatever
    // In this case "--verbose" is not parsed by nopt and args.vergbose will be
    // false, the unparsed args after -- are kept in unparsedArgs and can be
    // passed downstream to some scripts invoked by Cordova.
    var unparsedArgs = [];
    var parseStopperIdx = args.argv.original.indexOf('--');
    if (parseStopperIdx !== -1) {
        unparsedArgs = args.argv.original.slice(parseStopperIdx + 1);
    }

    // args.argv.remain contains both the undashed args (like platform names)
    // and whatever unparsed args that were protected by " -- ".
    // "undashed" stores only the undashed args without those after " -- " .
    var remain = args.argv.remain;
    var undashed = remain.slice(0, remain.length - unparsedArgs.length);
    var cmd = undashed[0];
    var subcommand;


    if (!cmd || cmd === 'help' || args.help) {
        if (!args.help && remain[0] === 'help') {
            remain.shift();
        }
        return printHelp(remain);
    }

    if (cmd === 'create'){
        return new CreateCommand().execute(remain, args, cb);
    }
    /*
    if (cmd === 'deploy'){
        return new DeployCommand().execute(remain, args, cb);
    }
    if (cmd === 'serve'){
        return new ServeCommand().execute(remain, args, cb);
    }
    if (cmd === 'undeploy'){
        return new UndeployCommand().execute(remain, args, cb);
    }
    if (cmd === 'test'){
        return new TestCommand().execute(remain, args, cb);
    }
    */

    return printHelp(remain);

}

function getSubCommand (args, cmd) {
    if (['platform', 'platforms', 'plugin', 'plugins', 'telemetry', 'config'].indexOf(cmd) > -1) {
        return args[3]; // e.g: args='node cordova platform rm ios', 'node cordova telemetry on'
    }
    return null;
}

function printHelp (command) {
    var result = help([command]);
    console.log(chalk.green(result));
}

function checkForUpdates () {
    /*
    try {
        // Checks for available update and returns an instance
        var notifier = updateNotifier({
            pkg: pkg,
            registry: 'github',
            githubOwner: 'github-vipera',
            updateCheckInterval: 0
        });
        // Notify using the built-in convenience method
        notifier.notify();
    } catch (e) {
        // https://issues.apache.org/jira/browse/CB-10062
        if (e && e.message && /EACCES/.test(e.message)) {
            console.log('Update notifier was not able to access the config file.\n' +
                'You may grant permissions to the file: \'sudo chmod 744 ~/.config/configstore/update-notifier-cordova.json\'');
        } else {
            throw e;
        }
    }
    */
   updateNotifier({pkg}).notify();   
}


var knownOpts = {
    'version': String,
    'help': Boolean,
    'name' : String,
    'template' : String,
    'description' : String,
    'offline' : Boolean,
    'remote-host' : String,
    'publish' : String,
    'user' : String,
    'passwd' : String
};

var shortHands = {
    'v': '--version',
    'h': '--help',
    't': '--template',
    'n': '--name',
    'd': '--description',
    'o': '--offline',
    'r': '--remote-host',
    'p': '--publish'
};

