var htmlparser = require('htmlparser2');

var parser = new htmlparser.Parser({
    onopentag: function(name, attribs){
    	console.log(attribs)
        // if(name === "script" && attribs.type === "text/javascript"){
        //     console.log("JS! Hooray!");
        // }
    },
    onattribute: function(name, val) {
    	console.log(name, val);
    },
    ontext: function(text){
        console.log("-->", text);
    },
    onclosetag: function(tagname){
        // if(tagname === "script"){
        //     console.log("That's it?!");
        // }
    }
}, {decodeEntities: true});
parser.write("Xyz <script \n ttt='z'\n type='text/javascript'>var foo = '<<bar>>';</ script>");
parser.end();