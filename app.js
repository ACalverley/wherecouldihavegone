//use express
var express = require("express"),
    app = express();
    
//all files to be rendered are ejs (no longer need .ejs at the end)
app.set("view enginer", "ejs");

app.use(express.static(__dirname + '/public'));

//function that runs when loading a page (get request)
app.get("/", function(req,res){
    res.render("home.ejs");
});

app.get("*", function(req, res){
   res.send("Sorry, page not found...What are you doing with your life?"); 
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!");
});