const express = require('express');
const router = express.Router();
const path = require('path');
const mysql = require('mysql2/promise');
const { get } = require('http');

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

router.post('/login', async (req, res, next)=>{
    const {email, pwd} = req.body;
    try{
        const sql = 'select * from user where email=?';
        const connection = await getConnection();
        const [rows, fields] = await connection.query(sql, [email]);
        if( rows.length >= 1){
            if( rows[0].pwd == pwd ){
                const uniqueInt = Date.now();
                req.session[uniqueInt] = rows[0].email;
                res.cookie( 'session', uniqueInt, {httpOnly:true, path:'/'});
                res.json({msg:'ok'});
            }else{
                res.json({msg:'패스워드를 확인하세요'});
            }
        }else{
            res.json({msg:'아이디가 없습니다'});
        }
    }catch(err){ next(err);}
});

router.get('/logout', (req, res)=>{
    delete req.session[req.cookies.session]; 
    res.clearCookie('session', req.cookies.session ,{ httpOnly : true,   path : '/'  });
    res.redirect('/');
});


router.get('/joinform', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/joinform.html') );
});

router.post('/join', async(req, res, next)=>{
    const {email, pwd, nickname} = req.body;
    try{
        const connection = await getConnection();
        let sql = "select * from user where email=?";
        const [rows1, fields1] = await connection.query(sql, [email]);
        if( rows1.length>=1){
            return res.json({msg:'이메일이 중복됩니다'});
        }
        sql = "select * from user where nickname=?";
        const [rows2, fields2] = await connection.query(sql, [nickname]);
        if( rows2.length>=1){
            return res.json({msg:'닉네임이 중복됩니다'});
        }
        sql = "insert into user(email, nickname, pwd) values(?,?,?)";
        const [result] = await connection.query(sql, [email, nickname, pwd]);
        res.json({msg:'ok'});
    }catch(err){next(err);}
});


module.exports = router;