var express = require('express');
var router = express.Router();

/* GET search_results page. */
router.get('/', function (req, res, next) {

    var zip_code = req.query.zip_code;
    var issue_category = req.query.issue_category;
    console.log(issue_category);

    req.getConnection(function(err, connection) {

        var query = connection.query("SELECT issue.id, issue.title, category.name, " +
            "issue.description, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id " +
            "WHERE category.name LIKE '%" + issue_category + "%' AND zipcode LIKE '%" + zip_code + "%'", function(err,rows) {
            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('search_results', {title: 'Search Results', zcode: zip_code, data: rows});
            //console.log(rows)
        });
    });

});

module.exports = router;