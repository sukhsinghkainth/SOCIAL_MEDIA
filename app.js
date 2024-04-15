const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer')
const knex = require('knex')(require('./config/knexfile'));
var path = require('path');
const cookieParser = require('cookie-parser');
var router = express.Router();
const app = express();
const { v4: uuidv4 } = require('uuid');
const { error, log } = require('console');
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// multer for store images into local disk

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        const unique = uuidv4();
        cb(null, unique + path.extname(file.originalname));
    }
})
const upload = multer({ storage: storage })



// login page 

app.get('/login', function (req, res) {
    res.render('login', { footer: false });
})


// Middleware for checking authentication if user  is logged in or not

const IsAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, 'socialMediaSite');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// logout 

app.get('/logout', (req, res) => {
    // Clear the JWT token from the client's cookies
    res.clearCookie('token');

    // Redirect the user to the login page or send a success message
    res.redirect('/login');
});

app.get('/like/:id', IsAuth, async (req, res) => {

    try {
        const user = req.user.user; // Authenticated user
        const postId = req.params.id; // ID of the post being liked

        // Check if the user has already liked the post
        const existingLike = await knex('post_likes')
            .where({ post_id: postId, username: user })
            .first();

        if (existingLike) {



            // User has already liked the post
            return res.status(400).json({ message: 'You have already liked this post.' });
        }

        // Insert a new like for the post
        await knex('post_likes').insert({ post_id: postId, username: user });

        // Send success response

        console.log('like success')
        res.status(200).json({ message: 'Post liked successfully.' });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});


app.get("", (req, res) => {

    res.render('index')

})

//rendering frontend for uploading images 

app.get("/upload", IsAuth, function (req, res) {
    res.render('upload', { footer: true })
})

app.get("/edit", IsAuth, async function (req, res) {
    let user = (await knex('user_profiles')).find(u => u.username == req.user.user);
    res.render("edit", { user })
})



app.get('/feed', IsAuth, async function (req, res) {
    try {
        // Query to retrieve posts with like counts
        const postsWithLikes = await knex('user_posts')
            .leftJoin('post_likes', 'user_posts.post_id', knex.raw('"post_likes"."post_id"'))
            .groupBy(
                'user_posts.post_id',
                'user_posts.timestamp',
                'user_posts.content_description',
                'user_posts.username',
                'user_posts.IMAGE'
            )
            .select(
                'user_posts.*',
                knex.raw('COUNT("post_likes"."post_id") as like_count') // Calculate like count
            )
            .orderBy('user_posts.timestamp', 'desc');

        // Query to retrieve posts with aggregated comments
        const postsWithComments = await knex('user_posts')
            .leftJoin('POST_COMMENTS', 'user_posts.post_id', knex.raw('"POST_COMMENTS"."POST_ID"'))
            .groupBy(
                'user_posts.post_id',
                'user_posts.timestamp',
                'user_posts.content_description',
                'user_posts.username',
                'user_posts.IMAGE'
            )
            .select(
                'user_posts.*',
                knex.raw(`LISTAGG("POST_COMMENTS"."USERNAME" || ':' || "POST_COMMENTS"."TEXT_CONTENT", ', ') WITHIN GROUP (ORDER BY "POST_COMMENTS"."POST_COMMENT_ID") as comments`) // Aggregate comments
            )
            .orderBy('user_posts.timestamp', 'desc');

        // Merge the responses based on post_id
        const mergedPosts = postsWithLikes.map(postWithLike => {
            const postWithComment = postsWithComments.find(post => post.post_id === postWithLike.post_id);
            if (postWithComment) {
                return {
                    ...postWithLike,
                    comments: postWithComment.COMMENTS ? parseComments(postWithComment.COMMENTS) : []
                };
            } else {
                return {
                    ...postWithLike,
                    comments: []
                };
            }
        });

        // Render the merged posts
        res.render('feed', { footer: true, posts: mergedPosts });
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Helper function to parse comments
function parseComments(commentsStr) {
    const formattedComments = [];
    const commentsArray = commentsStr.split(', ');
    for (const comment of commentsArray) {
        const [username, commentText] = comment.split(':');
        formattedComments.push({ username, comment: commentText });
    }
    return formattedComments;
}


app.post("/submit_comment", IsAuth, async (req, res) => {
    try {
        let uuid = uuidv4();
        console.log(req.body, req.user.user);
        const { postId, comment } = req.body;
        const username = req.user.user;


        // Insert the comment into the database
        await knex('POST_COMMENTS').insert({
            POST_ID: postId,
            TEXT_CONTENT: comment,
            USERNAME: username
        });

        console.log("Comment submitted successfully:", { postId, comment, username });
        res.status(200).json({ message: 'Comment submitted successfully.' });
        window.location.reload();
    } catch (error) {
        console.error('Error submitting comment:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});


app.get('/profile', IsAuth, async function (req, res) {
    let user = (await knex('user_profiles')).find(u => u.username == req.user.user);
    const posts = await knex('user_posts').where('username', req.user.user);
    res.render('profile', { footer: true, user, posts })
})


// POST REQUEST INSERTING THE DATA INTO  DATABASE TABLE USERS_PROFILES

app.post('/register', async (req, res) => {

    try {

        // fetching the data from req body like this 

        // this is called destructring the data 

        const { username, first_name, last_name, DOB, email, password } = req.body;

        //    after that check for empty fields  if user hit submit without proper filed

        if (!username, !first_name, !last_name, !DOB, !email, !password) {
            return res.status(400).send("all fields are required")
        }

        // CHECK IF USER ALREADY EXIST BY EMAIL ID user phela to hi bnea hoya h 

        // await odo lgaine a jdo koi async operation hunda h jisnu time lgda 

        // knex ik querybuilder h jiste query chla skde a just like sequilize 

        const exist_user = await knex('user_profiles').where("email", email)

        // if user exist then throw error 

        if (exist_user.length > 0) {
            console.log(exist_user)
            return res.status(400).send("user already exist")
        }

        // insert  into database table 

        await knex('user_profiles').insert({
            username: username,
            firstname: first_name,
            lastname: last_name,
            dob: DOB,
            email: email,
            password: password
        });

        res.redirect('/login');

    } catch (error) {
        console.error(error)
        res.status(500).send('server error')
    }
})


//                             for image posting

app.post('/post', IsAuth, upload.single('image'), async (req, res) => {
    try {
        const user = req.user.user
        const { caption } = req.body;
        const fileName = req.file.filename;

        if (!caption || !fileName) {
            return res.status(400).send("Content description and image provide pls.");
        }
        const [post_id] = await knex('user_posts').insert({
            content_description: caption,
            username: user,
            IMAGE: fileName
        }).returning('post_id')
        res.status(200).json({ success: true, message: "Post uploaded successfully.", post_id: post_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error." });
    }
})

//                            user profile update
app.post('/update', upload.single('image'), async (req, res) => {

    try {

        const { username, firstname, lastname, dob, email, BIO } = req.body
        const fileName = req.file ? req.file.filename : null; // Check if a file is uploaded

        console.log(username, firstname, lastname, dob, email, BIO, fileName)
        if (!username || !firstname || !lastname || !dob || !email) {
            return res.status(400).send("All fields except for profile picture are required.");
        }

        const updateData = {
            firstname: firstname,
            lastname: lastname,
            dob: dob,
            email: email,
            BIO: BIO
        };

        if (fileName) {
            updateData.PROFILE_PICTURE = fileName;
        }
        const update = await knex('user_profiles').where('username', username)
            .update(updateData);
        res.redirect('/edit')
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }

})

//                              post request for login 

app.post('/login', async function (req, res) {
    try {
        const { username, password } = req.body;

        // check the fields are empty or not  

        if (!username || !password) {

            return res.status(400).send('please fill all field ');
        }

        let user = (await knex('user_profiles')).find(u => u.username == username);

        if (!user || user.password != password) {
            return res.status(404).send('invalid credential')
        }

        else {
            const jwtKey = 'socialMediaSite';
            const token = jwt.sign({ user: user.username }, jwtKey, {
                expiresIn: '4h',
            })
            res.cookie("token", token, {
                expires: new Date(Date.now() + 3 * 3600 * 1000),
                httpOnly: true
            })
            return res.redirect("/feed")
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "login fail INVALID CREDENTIAL",
        });
    }
})

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});


app.get('/friends', IsAuth, async function (req, res) {
    try {
        // Fetch all users
        const users = await knex('user_profiles').whereNot('username', req.user.user);

        // Fetch all friendships for the current user
        const friendships = await knex('friendships')
            .where('profile_req', req.user.user)
            .orWhere('profile_accept', req.user.user);
        // Prepare the data for the template
        const userData = users.map(user => {
            const isFollowing = friendships.some(friendship =>
                (friendship.profile_req === req.user.user && friendship.profile_accept === user.username) ||
                (friendship.profile_accept === req.user.user && friendship.profile_req === user.username)
            );

            return { ...user, isFollowing };
        });
        // Render the friend.ejs page with the user data
        res.render('friend', { footer: true, users: userData });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

app.post('/follow', IsAuth, async function (req, res) {
    try {
        const { username } = req.body;
        const currentUser = req.user.user;

        // Check if the current user is already following the target user
        const existingFriendship = await knex('friendships')
            .where({ profile_req: currentUser, profile_accept: username })
            .orWhere({ profile_req: username, profile_accept: currentUser })
            .first();

        if (!existingFriendship) {
            // Insert a new friendship record
            await knex('friendships').insert({
                profile_req: currentUser,
                profile_accept: username
            });
            res.status(200).json({ message: 'Followed successfully.' });
        } else {
            await knex('friendships')
                .where({ profile_req: currentUser, profile_accept: username })
                .orWhere({ profile_req: username, profile_accept: currentUser })
                .del();
            res.status(200).json({ message: 'Unfollowed successfully.' });
        }
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});