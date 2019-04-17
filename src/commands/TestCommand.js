/**
 * Created by marcobonati on 30/11/2017.
 */
const chalk = require('chalk');
var Q = require("q");
const git = require('simple-git/promise');
var tmp = require('tmp');
var path = require('path');
const fs = require('fs-extra')
const inquirer = require('inquirer');

/**
 *
 * @constructor
 */
function TestCommand(){

}


TestCommand.prototype.execute = function(commands, args, callback) {

    this.updateForProxy().then((answers)=>{
        console.log(JSON.stringify(answers, null, '  '));
    });

    /*
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
        }
    ];

     function wantProxy(value) {
        return function(answers) {
          console.log("wantProxy for ", answers);
        return answers.proxyEnabled;
        };
      }

     inquirer.prompt(questions).then( (answers) => {
        console.log('\nOrder receipt:');
        console.log(JSON.stringify(answers, null, '  '));
      });

    */

    /*
    var questions = [
        {
          type: 'confirm',
          name: 'toBeDelivered',
          message: 'Is this for delivery?',
          default: false
        },
        {
          type: 'input',
          name: 'phone',
          message: "What's your phone number?",
          validate: function(value) {
            //var pass = value.match(
            //  /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
            //);
            //if (pass) {
            //  return true;
            //}
            //return 'Please enter a valid phone number';
           return true;
          }
        },
        {
          type: 'list',
          name: 'size',
          message: 'What size do you need?',
          choices: ['Large', 'Medium', 'Small'],
          filter: function(val) {
            return val.toLowerCase();
          }
        },
        {
          type: 'input',
          name: 'quantity',
          message: 'How many do you need?',
          validate: function(value) {
            var valid = !isNaN(parseFloat(value));
            return valid || 'Please enter a number';
          },
          filter: Number
        },
        {
          type: 'expand',
          name: 'toppings',
          message: 'What about the toppings?',
          choices: [
            {
              key: 'p',
              name: 'Pepperoni and cheese',
              value: 'PepperoniCheese'
            },
            {
              key: 'a',
              name: 'All dressed',
              value: 'alldressed'
            },
            {
              key: 'w',
              name: 'Hawaiian',
              value: 'hawaiian'
            }
          ]
        },
        {
          type: 'rawlist',
          name: 'beverage',
          message: 'You also get a free 2L beverage',
          choices: ['Pepsi', '7up', 'Coke']
        },
        {
          type: 'input',
          name: 'comments',
          message: 'Any comments on your purchase experience?',
          default: 'Nope, all good!'
        },
        {
          type: 'list',
          name: 'prize',
          message: 'For leaving a comment, you get a freebie',
          choices: ['cake', 'fries'],
          when: function(answers) {
            return answers.comments !== 'Nope, all good!';
          }
        }
      ];
      
      inquirer.prompt(questions).then(answers => {
        console.log('\nOrder receipt:');
        console.log(JSON.stringify(answers, null, '  '));
      });
      */


    return -1;
}

TestCommand.prototype.updateForProxy = function() {

    var myPromise = new Promise(function(resolve, reject){

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

        inquirer.prompt(questions).then( (answers) => {
            //console.log('\nOrder receipt:');
            //console.log(JSON.stringify(answers, null, '  '));
            resolve(answers);
        });
    
    });

    return myPromise;

}




// export the class
module.exports = TestCommand;