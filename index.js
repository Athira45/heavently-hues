const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('./config/passport')
const path = require('path');
require('dotenv').config();
const dbconnect = require('./config/dbconnect');
const flash = require('express-flash');
const port = process.env.port || 4000
dbconnect();


const adminRoute = require('./Routes/adminRoute');
const userRoute = require('./Routes/userRoute');

 
// app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(express.urlencoded({ extended:false}));
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
 
app.use(session({
    secret:process.env.SESSION_SECRET_KEY,
    resave:false,
    saveUninitialized:true,  
    cookie:{
        secure:false,
    }  
}));

app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

app.use(flash());
app.use('/admin',adminRoute);

app.use('/',userRoute);

// console.log(port);
app.listen(port,()=>{console.log("http://localhost:4000 and http://localhost:4000/admin/adlogin")})

