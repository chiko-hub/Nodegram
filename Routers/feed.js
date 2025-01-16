const express = require('express');
const path = require('path');
const router = express.Router();
const mysql = require('mysql2/promise');
const multer = require('multer');
async function getConnection(){
    let connection = await mysql.createConnection(
        {
            host : 'localhost',
            user : 'root',
            password : 'adminuser',
            database : 'nodegram'
        }
    );
    return connection;
}
router.get('/mainlist', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/mainlist.html') );
});
module.exports = router;