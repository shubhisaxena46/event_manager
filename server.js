
// Init

var express                 = require('express'),
    app                     = express(),
    bodyParser              = require('body-parser'),
    mongoose                = require('mongoose'),
    MongoClient             = require('mongodb').MongoClient,
    passport                = require('passport'),
    User                    = require("./models/user"),
    LocalStrategy           = require('passport-local'),
    passportLocalMongoose   = require("passport-local-mongoose");

app.use(require("express-session")({        
    secret: "iloveprogramming",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs')


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


var db // db variable it's defination 

mongoose.connect('mongodb://admin:admin@ds111476.mlab.com:11476/events-management', (err, database) => {
    // ... start the server
    if (err) return console.log(err)
    db = database
    app.listen(process.env.PORT || 3000, function(){
        console.log('listening on port 3000\npress cmd+c to stop');
     });
    }
);

var eventSchema = new mongoose.Schema({
    name: String,
    time: String,
    date: String,
    organiser: String,
    location: String,
    tickets: String,
    details: String
})

var commentSchema = new mongoose.Schema({
    name: String,
    event_id: String,
    comment: String
})

var events = mongoose.model("events", eventSchema);
var comments = mongoose.model("comments", commentSchema);


// ---------- Routing  ---------------


function isLoggedinOrganiser(req, res, next){
    
    if(req.isAuthenticated()){
       if(req.user.type == "organiser"){
        console.log("The user is an organiser");
        return next();
        
       }
        
       res.send("unauthorised"); 
    }
    res.redirect("/login");
}


function isLoggedin(req, res, next){
    
    if(req.isAuthenticated()){
        return next(); 
    }
    res.redirect("/login");
}

// Home Page
app.get('/',isLoggedin, (req, res)=>    {
    res.redirect("all");
});

app.get('/addevent',isLoggedinOrganiser, (req, res)=>    {
    res.render("home.ejs");
});

// Register
app.get('/register', (req, res)=>    {
    res.render("register.ejs");
});


app.post('/register', (req, res)=>    {

    User.register(new User({username: req.body.username, name: req.body.name, type : req.body.type})
    , req.body.password , function(err, user){
        if(err){ 
            console.log(err);   
            return res.redirect('register');
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/all");   
        });  
    } )
});


// Login
app.get('/login', (req, res)=>    {
    res.render("login.ejs");
});

app.post('/login',passport.authenticate("local" ,{
    successRedirect: "/all",
    faliureRedirect: "/login"
    }), (req, res)=>    {

});



// LogOut
app.get('/logout', (req, res)=>    {
    req.logout();
    res.redirect("login");
});
 
// Complete event list
app.post("/all",isLoggedin, (req, res)=>{
    req.body.organiser = req.user.name;
    events.create(req.body, (err,result)=>{
            if(err) return console.log(err)
            console.log('saved to database')
            res.redirect('/all')
    });
});




app.get("/all",isLoggedin, (req, res)=>{

    events.find({}, function(err, results){
        if(err){
            console.log(err);
        }
        res.render('eventlist.ejs', {events : results});
    })
})

// Complete event list in json

app.get("/allevents",isLoggedin, (req, res)=>{   
    events.find({}, function(err, results){
        if(err){
            console.log(err);
        }
        res.send({events : results}) 
    })

})


// Singular Event
app.get("/all/:event_id", isLoggedin, function(req, res){
    var event_id = req.params.event_id;
    var event_id = req.params.event_id;
    var list;

    comments.find({}, function(err, resul){
        console.log(resul+"<-----------");
        
        
        
    events.find({}, function(err, results){
        results.forEach(element=>{
            if(element._id ==event_id)
            {
                return res.render("event.ejs", {event: element, comments : resul});
            }
        })
            
     })

    });
    

});

// Singuar event in json
app.get("/allevents/:event_id",isLoggedin, function(req, res){

    events.find({}, function(err, results){
        results.forEach(element=>{
            if(element._id ==event_id)
            {
                res.send({event: element});
            }
        })
            
    })
});


// Commenting on any event

app.get("/addComment", function(req, res){
        res.render("addcomment.ejs", {event_id : 1111});
});

app.post("/addcomment", function(req, res){
    comments.create(req.body, (err,result)=>{
        if(err) return console.log(err)
        console.log('saved to database')
        var url = '/all/'+req.body.event_id;
        res.redirect(url);
});

});

    

app.get("/delete",isLoggedinOrganiser, function(req, res){
    res.render("deleteevent.ejs");
});



app.post("/delete",isLoggedinOrganiser, function(req, res){
  
    var event_id = req.body.event_id;
    
    events.find({}, function(err, results){
        results.forEach(element=>{
            if(element._id ==event_id)
            {
                events.remove(element,function(err, obj) {
                    if (err) throw err;
                    console.log(obj.result.n + " document(s) deleted");
                    res.redirect('/allevents');
                  });
            }
        })
            
    });
});




app.get("*", function(req, res){
    res.send("<strong>404</strong> You seem lost!");
});

   



