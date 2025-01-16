const express = require('express');
const router = express.Router();
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const passport = require('passport');

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
            //  전송된 pwd 를 암호화해서 저장된  pwd 와 비교합니다
            const result = await bcrypt.compare(pwd, rows[0].pwd );
            // if( rows[0].pwd == pwd ){
            if( result ){
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
        const hash = await bcrypt.hash(pwd, 12);
        const [result] = await connection.query(sql, [email, nickname, hash]);
        res.json({msg:'ok'});
    }catch(err){next(err);}
});


router.get('/getLoginUser', async (req, res, next)=>{
    const email = req.session[ req.cookies.session ];
    try{
        const connection = await getConnection();
        let sql = 'select * from user where email=?';
        let [rows, fields] = await connection.query( sql, [email] );
        
        let loginUserNick = rows[0].nickname;

        // 나를 팔로우 하는 사람 검색
        sql = 'select * from follow where fto=?';
        let [rows2, fields2] = await connection.query(sql, [loginUserNick]);
        // rows 는 {ffrom:값, fto:값}들로 구성된 객체 배열
        let followers;
        if( rows2.length>=1){
            followers = rows2.map((row)=>{
                return row.ffrom;
            });  // map에 의해서 각 요소별 반복실행으로 리턴되는 값이 하나의 변수에 전달된다면 배열로 저장
        }else{
            followers = [];
        }

        // 내가 팔로우 하는 사람 검색
        sql = 'select * from follow where ffrom=?';
        let [rows3, fields3] = await connection.query(sql, [loginUserNick]);
        // rows 는 {ffrom:값, fto:값}들로 구성된 객체 배열
        let followings;
        // if( rows3.length>=1){
        //     followings = rows2.map((row)=>{
        //         return row.fto;
        //     });  
        // }else{
        //     followings = [];
        // }
        followings = (rows3.length>=1)? rows3.map( (row)=>{ row.fto } ) :[]; 

        res.json( { loginUser:rows[0] , followers, followings } );
    }catch(err){ next(err); }
});

router.post('/follow', async (req, res, next)=>{
    const {ffrom, fto } = req.body;
    try{
        const connection = await getConnection();
        const sql = 'insert into follow(ffrom, fto) values(?,?)';
        const [result] = await connection.query(sql, [ffrom, fto]);
        res.send('ok');
    }catch(err){next(err);}
});


router.get('/kakao', passport.authenticate('kakao') );

router.get('/kakao/callback', 
    passport.authenticate(
        'kakao', 
        { failureRedirect: '/', }),  
        (req, res) => {
            const uniqueInt = Date.now();
            req.session[uniqueInt] = req.user.email;
            res.cookie('session', uniqueInt, {httpOnly : true,path : '/'});
            res.redirect('/user/editProfile');    // 성공했을때 이동할 주소
        }
);

router.get('/editProfile', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/edtiProfile.html')) ;
});

router.post('/updateProfile', async (req, res, next)=>{
    const {email, nickname, name, sns_id} = req.body;
    try{
        const connection = await getConnection();
        let sql = 'select * from user where email=?';
        let [rows, fields] = await connection.query(sql, [email]);
        if( rows.length>=1){
            return res.send('이메일이 중복됩니다');
        }

        sql = 'select * from user where nickname=?';
        [rows, fields] = await connection.query(sql, [nickname]);
        if( rows.length>=1){
            return res.send('닉네임이 중복됩니다');
        }

        let regix = email.match( /\w+@(\w+[.])+\w+/g );
        if( !regix ){
            return res.send('정확한 이메일을 입력하세요');
        }

        sql = 'update user set email=?, nickname=?, name=? where sns_id=?';
        let [result] = await connection.query(sql, [email, nickname, name, sns_id]);

        req.session[req.cookies.session ] = email;

        res.send('ok');

    }catch(err){next(err);}
});

module.exports = router;