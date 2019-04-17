/**
 * Created by marcobonati on 29/11/2017.
 */

var fs = require('fs');
var path = require('path');

const BIN_NAME = "wadmin";

module.exports = function help (args) {
    var command,
        file,
        raw,
        docdir;
    args = args || [];
    command = ((args)[0] || 'wadmin');
    docdir = path.join(__dirname, '..', 'doc');
    file = [
        command + '.md',
        command + '.txt',
        'wadmin.md',
        'wadmin.txt'
    ].map(function (file) {
        var f = path.join(docdir, file);
        if (fs.existsSync(f)) {
            return f;
        }
    }).filter(function (f) {
        return !!f;
    });
    raw = fs.readFileSync(file[0]).toString('utf8').replace(/wc-cli/g, BIN_NAME);

    return raw;
};
