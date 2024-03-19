const express = require('express');
const app = express();

const knex = require('knex')(require('./config/knexfile'));
var router = express.Router();
var path = require('path')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// Sample route to get all users
app.get('', function(req,res){
    res.render('index', { footer: false });
})
app.get('/login' , function(req,res){
    res.render('login' , { footer: false });
})
app.get('/api/users', async (req, res) => {
    try {
        const users = await knex('users').select('*');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
app.get('/feed',function(req,res){
    res.render('feed',{footer:true})
})

app.get('/profile',function(req,res){
    res.render('profile',{footer:true})
})

app.get('/search', function(req,res){
    res.render('search',{footer: true})
})

app.get("/edit", function(req,res){
    res.render("edit", { footer:true})
})

app.get("/upload", function(req,res){
    res.render('upload',{footer: true})
})

router.get('profileUser', function(req,res){
    res.render('userprofile',{footer : true})
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
