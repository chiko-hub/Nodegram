// kakaostrategy.js
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
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

//const func1 = ()=>{}
//module.exports = func1;

module.exports=()=>{
    passport.use(
        new KakaoStrategy(
            // 아래 객체를 이용해서 카카오로그인 최초 시작
            {
                // 아래 정보로 사용자 인증 절차가 진행됩니다.
                clientID: process.env.KAKAO_ID,
                callbackURL: '/user/kakao/callback',
            },
            // 아래 함수에 매개변수로 토큰들을 받아서 사용자정보를 얻어오고 회원가입이 진행
            async ( accessToken, refreshToken, profile, done )=>{ 
                // console.log( 'profile :', profile );
                console.log( profile._json.kakao_account.email, profile.id , profile._json.properties.nickname);
                try{
                    const connection = await getConnection();
                    let sql = "select * from user where sns_id=?";
                    let [rows, fields] = await connection.query(sql, [profile.id]);
                    if( rows.length>=1){
                        done( null, rows[0] ); // 이미 가입 기록이 있다면 로그인 하러 갑니다
                    }else{
                        // 회원 가입후 로그인하러 갑니다
                        sql = 'insert into user(email, nickname, name, sns_id, provider) values(?,?,?,?,?)';
                        let [result] = await connection.query(sql, [profile.id, profile._json.properties.nickname, profile._json.properties.nickname, profile.id, 'kakao']);
                        // 방금 추가한 레코드 다시 검색후 done 실행
                        sql = "select * from user where sns_id=?";
                        [rows, fields] = await connection.query(sql, [ profile.id ] );
                        done( null, rows[0] );
                    }
                }catch(err){
                    console.error(err);
                    done(err);  //  에러가 있다면 에러내용을 가지고 로그인하러 갑니다.
                }

            }
        )        
    );
}