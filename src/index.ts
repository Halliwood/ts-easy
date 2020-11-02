import program = require("commander");
import Main from "./Main";

var myPackage = require("../package.json");

var getPath = (val:string): string => {
    let rst = val.match(/(['"])(.+)\1/);
    if(rst) return rst[2];

    return val;
};

// for exmaple
// as2ts 'E:\\qhgame\\trunk\\project\\src\\' 'E:\\qhgame\\tsproj\\src\\' 'example\\rule.json'
program
	.version(myPackage.version, "-v, --version")
	.option("-s, --src <path>", "[MUST] actionscript files path. both direction or single file.", getPath)
    .parse(process.argv);

if(!(<any>program).src) {
    console.warn("--src option is MUST.");
    program.help();
}

let main = new Main();
main.checkImports((<any>program).src, (<any>program).dist, (<any>program).module);