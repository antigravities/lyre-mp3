var http=require("http");
var fs=require("fs");
var exec = require('child_process').exec;
var queue = [];
var currentlyConverting="";

var log = console.log;
console.log = function(s){
	fs.appendFileSync("./lyre.log", s + "\n");
	log(s);
}

// Taken from http://stackoverflow.com/a/10315969
function ytVidId(url){
        var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        return (url.match(p)) ? RegExp.$1 : false;
}

String.prototype.startsWith = function(str){
        if(this.slice(0,str.length) == str) return true;
        else return false;
}

http.createServer(function(req,res){

	console.log("[HTTP] Request from " + req.connection.remoteAddress + ": " + req.url);

        if( req.url.startsWith("/index") || req.url == "/" ){
                res.end(fs.readFileSync("page.html"));
        }
        else if( req.url.startsWith("/api/add/") ){
                var m=ytVidId(decodeURIComponent(req.url.split("/")[3]));
                if( ! m ){
                        var obj = {};
                        obj.status = "error";
                        obj.message = "Invalid URL!";
                        res.end(JSON.stringify(obj));
                }
                else {
                        if( fs.existsSync("./files/" + m + ".mp3") ){
                                res.end(JSON.stringify({status: "exists", message: "That has already been converted. You can download it <a href='/files/" + m + ".mp3'>here</a>"}));
                                return;
                        }
                        var obj = {};
                        var t = false;
                        queue.forEach(function(v){
                                if( v == m ) t=true;
                        });

                        if( ! t ){
                                queue.push(m);
                                obj.status = "queued";
                                obj.message = "Added to queue.";
                        }
                        else {
                                obj.status = "inqueue";
                                obj.message = "Video is already in queue. Use /api/getStatus/" + m + " to get the queue status.";
                        }
                        obj.id = m;

                        res.end(JSON.stringify(obj));
                }
                return;
        }
        else if( req.url.startsWith("/api/getStatus/") ){

                var obj = {};

                if( req.url.split("/").length < 4 ){
                        res.end(JSON.stringify({status: "error", message: "No video URL."}));
                        return;
                }

                var id=req.url.split("/")[3];
                var position=-1;

                if( ! id == currentlyConverting ){
                        queue.forEach(function(v,k){
                                if( v == id ) position=k;
                        });

                        if( position == -1 ){
                                if( ! fs.existsSync("./files/" + id + ".mp3") ){
                                        obj.status = "error";
                                        obj.message = "Not in queue.";
                                }
                                else {
                                        obj.status = "done";
                                        obj.message = "<a href='/files/" + id + ".mp3'>Done!</a>";
                                }
                        }
                        else {
                                obj.status = "inqueue";
                                obj.message = "in position " + (position+1);
                        }
                        obj.id = id;
                        res.end(JSON.stringify(obj));
                        return;
                }
                else {
                        obj.status = "converting";
                        obj.message = "Currently converting";
                        res.end(JSON.stringify(obj));
                        return;
                }
        }
        else if( req.url.startsWith("/files/") && fs.existsSync("./files/" + req.url.split("/")[2]) ){
                fs.readFile("./files/" + req.url.split("/")[2], function(e,d){
                        if( e ) res.end("500 Internal Server Error");
                        else{
													res.writeHead(200, {"Content-Type": "audio/mpeg"});
													res.end(d);
												}
                });
        }
        else {
                res.end("404 Not Found");
        }
}).listen(3333);

function queueChecker(){
        if( currentlyConverting == "" && queue[0] ){
                currentlyConverting=queue[0];
                exec("youtube-dl " + queue[0], function(err, o, e){
                        console.log("[QUEUE] Converted video " + queue[0]);
												console.log(err);
                        queue.splice(0,1);
                        currentlyConverting="";
                });
                console.log("[QUEUE] youtube-dl called!");
        }
        setTimeout(queueChecker, 1000);
}

function deleteCache(){
        fs.readdirSync("./files").forEach(function(fileName) {
                fs.unlinkSync("./files/" + fileName);
        });
}

queueChecker();

setInterval(deleteCache, 1200000);
