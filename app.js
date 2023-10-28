const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const port = 4000;
const cors = require("cors");
let corsOptions = {
  origin: "http://localhost:3000", // 출처 허용 옵션
  credentials: true,
};

app.use(cors(corsOptions));

require("dotenv").config();

const mysql = require("mysql2");
const connection = mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected to ict-team!");

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: maxAge },
  })
);

app.use((req, res, next) => {
  res.locals.email = "";
  res.locals.password = "";

  if (req.session.user) {
    res.locals.email = req.session.user.email;
    res.locals.fullname = req.session.user.password;
  }
  next();
});

//라우팅
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/loginProc", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const sql = `select * from user where email=? and password=?`;
  const values = [email, password];

  connection.query(sql, values, function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.length === 0) {
      return res.status(401).send("아이디 또는 비밀번호가 틀립니다.");
    }

    req.session.user = result[0];
    res.send("로그인 되었습니다");
  });
});

app.get("/userInfo", (req, res) => {
  if (!req.session.user) {
    res.status(401).send("로그인이 필요합니다.");
    return;
  }

  res.json(req.session.user);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    console.log("세션을 삭제하였습니다.");
  });

  res.send("로그아웃 되었습니다.");
});

app.get("/regist", (req, res) => {
  res.render("regist");
});

app.post("/registProc", (req, res) => {
  // 회원 등록 하기
  const email = req.body.email;
  const password = req.body.password;
  const fullName = req.body.fullName;
  const address = req.body.address;
  const phone = req.body.phone;

  const sql = `insert into user(email,password,fullname,address,phone)values(?,?,?,?,?)`;
  const values = [email, password, fullName, address, phone];

  connection.query(sql, values, function (err, result) {
    if (err) throw err;
    console.log("자료 1개 삽입했습니다.");
    res.send("등록되었습니다.");
  });
});

app.get("/items", (req, res) => {
  const sql = `select * from items`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
    res.json(result);
  });
});

app.get("/items/:id", (req, res) => {
  const sql = `select * from items where id=${req.params.id}`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result[0]);
    res.json(result[0]);
  });
});

app.post("/carts", (req, res) => {
  if (!req.session.user) {
    res.status(401).send("로그인이 필요합니다.");
    return;
  }

  const user_id = req.session.user.id;
  const items_id = req.body.itemsId;
  const quantity = req.body.quantity;

  // 먼저 사용자의 장바구니에 해당 아이템이 이미 존재하는지 확인합니다.
  const checkSql = "SELECT * FROM cart WHERE user_id = ? AND items_id = ?";
  connection.query(checkSql, [user_id, items_id], function (err, results) {
    if (err) {
      res.status(500).send("Internal Server Error");
    }

    if (results.length > 0) {
      // 아이템이 이미 존재하면 수량을 업데이트합니다.
      const newQuantity = results[0].quantity + quantity;
      const updateSql =
        "UPDATE cart SET quantity = ? WHERE user_id = ? AND items_id = ?";
      connection.query(
        updateSql, [newQuantity, user_id, items_id],
        function (err, result) {
          if (err) {
            res.status(500).send("Internal Server Error");
          }
          console.log(result);
          res.json(result);
        }
      );
    } else {
      // 아이템이 존재하지 않으면 새로운 아이템을 추가합니다.
      const insertSql =
        "INSERT INTO cart(user_id, items_id, quantity) VALUES (?, ?, ?)";
      connection.query(
        insertSql,
        [user_id, items_id, quantity],
        function (err, result) {
          if (err) throw err;
          console.log(result);
          res.json(result);
        }
      );
    }
  });
});

app.get("/carts", (req, res) => {
  if (!req.session.user) {
    res.status(401).send("로그인이 필요합니다.");
    return;
  }

  const user_id = req.session.user.id;

  const sql = `select * from cart join items on cart.items_id=items.id where user_id=${user_id}`;
  connection.query(sql, function (err, result) {
    if (err) {
      res.status(500).send("Internal Server Error");
    }

    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
