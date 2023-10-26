const express = require('express')
const ejs = require('ejs');
const bodyParser = require('body-parser')
var session = require('express-session')
const app = express()
const port = 4000

require('dotenv').config()

const mysql = require('mysql2')
const connection = mysql.createConnection(process.env.DATABASE_URL)
console.log('Connected to ict-team!')


app.set('view engine','ejs')
app.set('views','./views')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 },
  resave:true, saveUninitialized:true}))

app.use((req, res, next)=>{  
  res.locals.email = "";
  res.locals.password = "";

  if(req.session.member){
    res.locals.user_id=req.session.user.email
    res.locals.name=req.session.user.password
  }
  next()
})

//라우팅
app.get('/', (req, res) => {
  res.render('index')    
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/loginProc', (req, res) => {  // 회원 로그인 하기
  const email = req.body.email;
  const password = req.body.password;
 
  var sql = `select * from user where email=? and password=?`  
  var values = [email,password];   
  connection.query(sql, values, function(err, result){
    if(err) throw err;
    if(result.length===0){
      res.send("<script>alert('없는 아이디입니다.');location.href='/login'; </script>")
    }else{
      console.log(result[0])  
      req.session.user = result[0]
      res.send("<script>alert('로그인 되었습니다.');location.href='/'; </script>")
    }   
  })
})

app.get('/logout',(req, res)=>{
  req.session.user = null;
  res.send("<script>alert('로그아웃 되었습니다.');location.href='/'; </script>")
})

app.get('/regist', (req, res) => {
  res.render('regist')
})

app.post('/registProc', (req, res) => {  // 회원 등록 하기
  const email = req.body.email;
  const password = req.body.password;
  const fullname = req.body.fullname;
  const address = req.body.address;
  const phone = req.body.phone;
 
  var sql = `insert into user(email,password,fullname,address,phone)values(?,?,?,?,?)`  
  var values = [email,password,fullname,address,phone];  
  connection.query(sql, values, function(err, result){
    if(err) throw err;
    console.log('자료 1개 삽입했습니다.');
    res.send("<script>alert('등록되었습니다.'); location.href='/login';</script>") 
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
