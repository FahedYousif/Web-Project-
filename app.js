const express = require('express')
const expressHandlebars = require('express-handlebars')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const bcrypt = require('bcrypt')
const appDB = require('./db.js')

const app = express()
const csrfProtection = csrf({cookie: true})
app.use(expressSession({
	secret: 'uijknm',
    resave: false,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())

app.use(express.static("public"))

app.engine("hbs", expressHandlebars({
    extname: "hbs", defaultLayout: "main"
}))

app.use(function(req, res, next){
    console.log("Recieved " + req.method + " for " + req.url)
    next()
})

app.get('/', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("index.hbs",{isLoggedIn: isLoggedIn})
})

//----------//Pages\\-----------//
app.get('/blogpost', csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.getAllBlogposts(function(error, Blogpost){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Blogpost: Blogpost,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken(),
            errors: errors
        }
        res.render("blogpost.hbs", model)
    })
})

app.get('/guestbook/:page', csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn
    const limit = 3
    var page = req.params.page
    var totalPosts = 0;

    //shows 3 post per page with offset depending on what page you are on
    const offset = (page -1) * limit
    var nextPage = Number(page) + 1;
    var previousPage = page - 1;
    if(page == 1){
        previousPage = 1;
    }

    appDB.getAllGuestbooks(offset, function(error, Guestbook){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Guestbook: Guestbook,
            isLoggedIn: isLoggedIn,
            nextPage: nextPage,
            previousPage: previousPage,
            token: req.csrfToken(),
            error: errors
        }
        res.render("guestbook.hbs", model)
    })
})

app.get('/faq',csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.getAllFaqs(function(error, Faq){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Faq: Faq,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken(),
            error: errors
        }
        res.render("faq.hbs", model)
    })
})

app.get('/about', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("about.hbs",{isLoggedIn: isLoggedIn})
})

app.get('/contact', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("contact.hbs",{isLoggedIn: isLoggedIn})
})




//----------//CREATE Blogpost\\-----------//
app.get('/createBlogposts', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn

    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    const model = {
        isLoggedIn: isLoggedIn,
        token: req.csrfToken()
    }
    res.render("createBlogposts.hbs",model)
})

app.post('/createBlogposts', csrfProtection, function(req, res){
    const title = req.body.title
    const postText = req.body.postText
    const errors = []
   
    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("createBlogposts.hbs", model)
    }else{
        appDB.createBlogPost(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createBlogposts.hbs", {error: errors})
            }
        })
        res.redirect("/blogpost")
    }
})

//------UPDATE FOR BLOGPOSTS------//
app.get('/update-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    appDB.getBlogpostById(id, function(error, Blogpost) {
        if(error){
            errors.push("Error! could not edit post.")
            res.render("blogpost.hbs", {error: errors})
        }
        const model = {
            Blogpost: Blogpost,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken()
        }
        res.render("update-blogpost.hbs", model)     
    })
})

app.post('/update-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const title = req.body.title
    const postText = req.body.postText
    const errors = []

    if(postText == "" || title == ""){
        errors.push("Please write something in both fields!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("update-blogpost.hbs", model)
    } else{
        appDB.updateBlogpost(id, title, postText, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("blogpost.hbs", {error: errors})
            }
        })
        res.redirect("/blogpost")
    }
})

//------DELETE FOR BLOGPOSTS------//
app.post('/delete-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteBlogpost(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("blogpost.hbs", {error: errors})
        }
    })
    res.redirect("/blogpost")
})


//----------//CREATE Guestbook\\-----------//
app.get('/createGuestbooks', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn

    const model = {
        isLoggedIn: isLoggedIn,
        token: req.csrfToken()
    }
    res.render("createGuestbooks.hbs", model)
})

app.post('/createGuestbooks', csrfProtection, function(req, res){
    const title = req.body.title
    const postText = req.body.postText
    const errors = []
    
    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        const model = {
            error: errors, 
            token:req.csrfToken()
        }
        res.render("createGuestbooks.hbs", model)
    }else{
        appDB.createGuestbook(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createGuestbooks.hbs", {error: errors})
            }
        })
        res.redirect("/guestbook/1")
    }    
})

//------UPDATE FOR GUESTBOOK------//
app.get('/update-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    appDB.getGuestbookById(id, function(error, Guestbook) {
        if(error){
            errors.push("Error! could not edit post.")
            res.render("guestbook.hbs", {error: errors})
        }
        const model = {
            Guestbook: Guestbook,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken()
        }
        res.render("update-guestbook.hbs", model)     
    })
})

app.post('/update-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const title = req.body.title
    const postText = req.body.postText
    const errors = []

    if(postText == "" || title == ""){
        errors.push("Please write something in both fields!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("update-guestbook.hbs", model)
    }else{
        appDB.updateGuestbook(id, title, postText, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("guestbook.hbs", {error: errors})
            }
        })
        res.redirect("/guestbook/1")
    }
})

//------DELETE FOR GUESTBOOK------//
app.post('/delete-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteGuestbook(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("guestbook/1.hbs", {error: errors})
        }
    })
    res.redirect("/guestbook/1")
})


//----------//CREATE FAQ\\-----------//
app.get('/createFaqs', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn

    const model = {
        isLoggedIn: isLoggedIn,
        token: req.csrfToken()
    }
    res.render("createFaqs.hbs", model)
})

app.post('/createFaqs', csrfProtection, function(req, res){ 
    const title = req.body.title
    const postText = req.body.postText
    const errors = []

    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("createFaqs.hbs", model)
    }else{
        appDB.createFaq(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createFaqs.hbs", {error: errors})
            }
        })
        res.redirect("/faq")
    }
})

//------UPDATE FOR FAQ------//
app.get('/update-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    appDB.getFaqById(id, function(error, Faq) {
        if(error){
            errors.push("Error! could not edit post.")
            res.render("faq.hbs", {error: errors})
        }
        const model = {
            Faq: Faq,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken()
        }
        res.render("update-faq.hbs", model)     
    })
})

app.post('/update-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const title = req.body.title
    const postText = req.body.postText
    const comment = req.body.comment
    const errors = []

    if(postText == "" || title == "" || comment == ""){
        errors.push("All fields are required!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("update-faq.hbs", model)
    }else{
        appDB.updateFaq(id, title, postText, comment, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("faq.hbs", {error: errors})
            }
        })
        res.redirect("/faq")
    }
})

//------DELETE FOR FAQ------//
app.post('/delete-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteFaq(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("faq.hbs", {error: errors})
        }
    })
    res.redirect("/faq")
})

//------SEARCH FOR FAQ------//
app.get('/searchFaq', csrfProtection, function(req,res){
    const errors = []
    const searchText = req.query.searchText
    var searchTime = req.query.searchTime
    const isLoggedIn = req.session.isLoggedIn
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/

    console.log(searchTime, searchText)
    if(searchTime == ""){
        searchTime = new Date().toISOString()
    }
    if(!searchTime.match(dateFormat)){
        errors.push("wrong format")
        res.render("faq.hbs", {error:errors})
    }
    if(searchText == ""){
        errors.push("you didn't search for anything!")
        res.render("faq.hbs", {error:errors})
    }else{
        console.log(searchTime, searchText)
        appDB.searchFaq(searchText, searchTime, function(error, Faq){
            if(error){
                errors.push("Error!, could not find something.")
            }
            const model = {
                Faq: Faq,
                searchText: searchText,
                searchTime: searchTime,
                isLoggedIn: isLoggedIn,
                token: req.csrfToken(),
                error: errors
            }
            res.render("faq.hbs", model)
        })
    }
})

//---------//LOGIN\\---------//
app.get('/login', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    const model = {
        isLoggedIn: isLoggedIn,
        token: req.csrfToken()
    }
    res.render("login.hbs", model)
})

app.post('/login', csrfProtection, function(req, res){
    const username = req.body.username
    const password = req.body.password
    const hashedPassword = "$2b$10$OsiaY76faZu8o8s1QuEoVOL3ZZg5OUjGFpJuknybVLaJocgAYnwv."
    const errors = []

    if(username == "" || password == ""){
        errors.push("Please type in username and password!")
        const model = {
            token: req.csrfToken(),
            error: errors
        }
        res.render("login.hbs", model)
    }else{
        if(username == "admin"){
            bcrypt.compare(password, hashedPassword, function(err, result) {
                if(err){
                    callback(err)
                }
                if(result){    
                    req.session.isLoggedIn = true
                    res.redirect("/")
                }else{
                    errors.push("This password is invalid")
                    res.render("login.hbs",{error: errors})
                }
            });
        }else{
            errors.push("This username is invalid")
            res.render("login.hbs",{error: errors})
        }
    }
})


app.post("/logout", function(req, res){
    req.session.isLoggedIn = false
    res.redirect("/")
})
 

app.listen(3000)