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

const uploadObj = multer({
    storage: multer.diskStorage({
      destination(req, file, done) {
        done(null, 'uploads/');
      },
      filename(req, file, done) {
        const ext = path.extname(file.originalname);
        done(null, path.basename(file.originalname, ext) + Date.now() + ext);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});


router.get('/mainlist', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/mainlist.html') );
});

router.get('/feedWriteForm', (req, res)=>{
    res.sendFile( path.join(__dirname, '/..', '/views/feedWriteForm.html') );
});


router.post('/imgup', uploadObj.single('img'), (req, res)=>{
    res.json( 
        { 
            savefilename:req.file.filename, 
            image:req.file.originalname 
        } 
    );
});


router.post('/writeFeed', async (req, res, next)=>{
    const { content, writer, image, savefilename }=req.body;
    const connection = await getConnection();
    try{        
        // feed 테이블에 게시물을 추가합니다
        let sql = 'insert into feed( content, writer, image, savefilename ) values(?,?,?,?)';
        const [result] = await connection.query(sql, [content, writer, image, savefilename]);

        // 추가된 feed 의 num 값을 추출해서 보관합니다
        const feednum = result.insertId;
        console.log(`feednum : ${feednum}`);

        // content 에서 해시태그들을 분리합니다.( 정규표현식 사용)
        const hashtags = content.match(/(?<=#)[^\s#]+/g);
        console.log(`해시테그들 : ${hashtags}`);

        // 각 해시태그별로 검색해서  hashtag 테이블에 존재하는 단어인지 검사
        if( hashtags ){
            let hashtagnum;
            hashtags.map( async (tag)=>{
                // 이미 존재하는 단이어면 그 단어의 num 값을 추출
                sql = 'select * from hashtag where word=?'
                const [rows, fields] = await connection.query(sql, [tag]);
                if( rows.length >= 1){
                    hashtagnum = rows[0].num;
                }else{
                    // 없는 단어이면  hashtag 테이블에 단어를 추가하고 추가된 레코드의  num 값을 추출
                    sql = 'insert into hashtag(word) values(?)';
                    const [result1] = await connection.query(sql, [tag]);
                    hashtagnum = result1.insertId;
                }
                // feed_hashtag 테블에 feed의 num 과 hashtag의 num으로 레코드를 추가합니다
                sql = "insert into feed_hashtag(feednum, hashnum) values(?,?)";
                const [result2] = await connection.query(sql, [feednum, hashtagnum]);
            });
        }
        connection.commit();
    }catch(err){ 
        connection.rollback();
        next(err);
    }
    res.send('ok');

});


router.get('/getFeedList', async (req, res, next)=>{
    try{
        const connection = await getConnection();
        const sql = 'select * from feed order by num desc';
        const [rows, fields] = await connection.query(sql);
        res.send(rows);
    }catch(err){
        next(err);
    }
});


router.post('/search', async (req, res, next)=>{
    const word = req.body.word;
    const connection = await getConnection();
    try{
        // word 로 hashtag 테이블을 검색해서 num 을 추출
        let sql = 'select * from hashtag where word=?';
        let [rows, fields] = await connection.query(sql, [word]);
        // 만약 결과가 없으면 빈배열을 send해서 검색 결과가 없는것으로 인식되게 합니다.
        if( rows.length == 0){
            return res.send([]);
        }
        // 검색결과인  hashtag 테이블의 num 으로 feed_hashtag 테이블에서  hashnum을 검색하고  feednum들을 추출!!!
        // 추출된 feednum들로 feed 테이블을 검색!!!
        // 이때 정황에 맞추서 서브쿼리를 사용합니다
        const hashtag_num = rows[0].num;
        sql = 'select * from feed ';
        sql += 'where num in( select feednum from feed_hashtag where hashnum=? ) ';
        sql += 'order by num desc';
        let [rows2, fields2] = await connection.query(sql, [hashtag_num]);
        if( rows2.length == 0){
            return res.send([]);
        }
        res.send(rows2);
    }catch(err){next(err);}
});

module.exports = router;