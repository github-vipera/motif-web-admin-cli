
const githubBranches = require('github-branches');

/**
 *
 * @constructor
 */
function TemplateList(){
}

TemplateList.prototype.getList = function(callback) {

    return new Promise((resolve,reject)=>{

        githubBranches('github-vipera/motif-web-admin-module-template-project').then(branches => {

            let ret = [];
            for (let i=0;i < branches.length; i++){
                let branchName = branches[i].name;        
                if (branchName.startsWith("templates/")){
                    var templateName = branchName.replace("templates/", "");
                    var templateName = templateName.replace("_template", "");
                    ret.push(templateName);
                }
            }
            resolve(ret);
        }, (error) =>{
            reject(error);
        });

    });
      

}

// export the class
module.exports = TemplateList;
