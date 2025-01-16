const passport = require('passport');
const kakao = require('./kakaostrategy');
const mysql = require('mysql2/promise');

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

module.exports = ()=>{
    // 이곳의 함수의 역할은 로그인이 정상 완료된후 req.login() 이 자동호출되면 추가로 같이 실행되는 함수들입니다
    passport.serializeUser((user, done) => {
        done(null, user.sns_id);  
        // 세션에 이메일만 저장하고
        // 쿠키에 있는 sid 값을 키로해서 세션값을 관리합니다.
        // 쿠키에서 확인할 수 있는 값 확인 요망
    });

    passport.deserializeUser( async (sns_id, done) => {
        const connection = await getConnection();
        try{
            let [rows, fields] = await connection.query('select * from user where sns_id=?', [sns_id]);
            done(null, rows[0]); //세션에 저장된 이메일과 쿠키로 user를 복구 & req.user 로 로그인된 사용자 정보 관리  (req.user <- rows[0])
        }catch(err){done(err);}
    });
    kakao(); 
}