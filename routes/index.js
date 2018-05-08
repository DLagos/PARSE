var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var thumb = require('node-thumbnail').thumb;
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null,'public/images/issue_images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});
var upload = multer({ storage: storage });

var max = null;

var creds = {

    host: "us-cdbr-iron-east-05.cleardb.net",
    user: "b3220b75dccc0a",
    password: "ddd8323b",
    database: "heroku_d6fcf8fd2312a32"

};

/* GET home page. */
router.get('/', function (req, res) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
    }

    var pool = mysql.createPool(creds);
    var query1 = 'SELECT name FROM category';
    var query2 = 'SELECT issue.id, issue.title, category.name, issue.thumbnail, ' +
        'issue.description, issue.address, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id;';

    var return_data = {};

    //init thumbnails folder if it doesn't exit
    var dir = 'public/images/thumbnails';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    //init thumbnail files if it doesn't exit
    thumb({
        source: 'public/images/issue_images', // could be a filename: dest/path/image.jpg
        destination: 'public/images/thumbnails',
        concurrency: 4
    }, function(files, err, stdout, stderr) {
        console.log('All done!');
    });

    async.parallel([
        function (parallel_done) {
            pool.query(query1, {}, function (err, results) {
                if (err) return parallel_done(err);
                return_data.table1 = results;
                parallel_done();
            });
        },
        function (parallel_done) {
            pool.query(query2, {}, function (err, results) {
                if (err) return parallel_done(err);
                return_data.table2 = results;
                //console.log(results);
                parallel_done();
            });
        }
    ], function (err) {
        if (err) console.log(err);
        //pool.end();
        res.render('index', {title: "Team 04", category: return_data.table1, data: return_data.table2, isLogged: isLoggedIn});
    });
});

router.get('/issue/view/:id', function (req, res, next) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
    }
    var id = req.params.id;

    req.getConnection(function (err, connection) {

        var query = connection.query('SELECT * FROM issue JOIN user ON issue.user_id = user.user_id, status WHERE issue.status = status.id AND issue.id = ?', [id], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            res.render('display_issue', {page_title: "View Result", data: rows, isLogged:isLoggedIn});


        });

        //console.log(query.sql);
    });
});


router.get('/submit', function (req, res, next){
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
    }
    req.getConnection(function (err, connection) {

        var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1,2], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            max = rows[0][0].id;
            res.render('submit', {page_title: "Submit", category:rows[1], isLogged:isLoggedIn});


        });

        //console.log(query.sql);
    });
});

router.post('/post_issue', upload.single('issue_image'), function (req, res) {
    var title = req.body.title;
    var desc = req.body.description;
    var zipcode = req.body.zipcode;
    var category = req.body.issue_category;
    var address = req.body.address;
    var latitude = req.body.Lat;
    var longitude = req.body.Lng;
    var filename = req.file.filename;

    //generating thumbail filename
    var f_name = filename.substring(0, filename.indexOf('.')) + '_thumb';
    var ext = filename.substring(filename.indexOf('.'));
    var thumnail_fname = f_name + ext;


    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('description', 'Description is required').notEmpty();
    req.checkBody('zipcode', 'Zip Code is required.').notEmpty();


    /* CHECK IF USER IS LOGGED IN */
    if(!req.isAuthenticated()){
        var username = req.body.username;
        var name = req.body.Name;
        var password = req.body.password;
        var password2 = req.body.password2;
        req.checkBody('username', 'Username is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

        var errorList = req.validationErrors();

        if(errorList)
            res.render('submit',{
                errors:errorList
            });
        max = max + 1;

        var data = {
            user_id: username,
            name: name,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
        };

        req.getConnection(function (err, connection) {


            var query = connection.query(
                "INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address) VALUES (" + max + ",'" + title + "','"
                + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'/images/issue_images/"
                + filename + "','/images/thumbnails/" + thumnail_fname + "','" + latitude + "','" + longitude + "','" + address + "');"
                + "INSERT INTO user set ?", data,
                function (err, rows) {
                    if (err)
                        console.log("Error Inserting : %s ", err);
                    res.redirect('/');
                });

        });

    } else {

        var errors = req.validationErrors();

        if (errors)
            res.render('submit', {
                errors: errors
            });
        max = max + 1;


        req.getConnection(function (err, connection) {


            var query = connection.query(
                "INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address) VALUES (" + max + ",'" + title + "','"
                + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'/images/issue_images/"
                + filename + "','/images/thumbnails/" + thumnail_fname + "','" + latitude + "','" + longitude + "','" + address + "')", function (err, rows) {
                    if (err)
                        console.log("Error Inserting : %s ", err);
                    res.redirect('/');
                });

        });
    }
});


module.exports = router;
