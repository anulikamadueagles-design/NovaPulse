const express=require('express');
const http=require('http');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const Database=require('better-sqlite3');
const {Server}=require('socket.io');

const app=express(); const server=http.createServer(app);
app.use(cors()); app.use(express.json({limit:'5mb'}));
const io=new Server(server,{cors:{origin:'*'}});
const db=new Database('novapulse.db');
const SECRET=process.env.NOVAPULSE_SECRET||'CHANGE_ME_IN_PRODUCTION';

db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,handle TEXT UNIQUE NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,bio TEXT DEFAULT '',avatar TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS likes(user_id INTEGER,post_id INTEGER,UNIQUE(user_id,post_id));
CREATE TABLE IF NOT EXISTS reposts(user_id INTEGER,post_id INTEGER,UNIQUE(user_id,post_id));
CREATE TABLE IF NOT EXISTS follows(follower_id INTEGER,following_id INTEGER,UNIQUE(follower_id,following_id));
CREATE TABLE IF NOT EXISTS bookmarks(user_id INTEGER,post_id INTEGER,UNIQUE(user_id,post_id));
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender_id INTEGER NOT NULL,receiver_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,read_at TEXT);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id,receiver_id,created_at);
`);

function sign(u){return jwt.sign({id:u.id,handle:u.handle},SECRET,{expiresIn:'30d'})}
function verify(t){return jwt.verify((t||'').replace(/^Bearer /,''),SECRET)}
function publicUser(id){return db.prepare('SELECT id,name,handle,bio,avatar FROM users WHERE id=?').get(id)}
function auth(req,res,next){try{req.user=verify(req.headers.authorization);next()}catch(e){res.status(401).json({error:'Authentication required'})}}

app.get('/api/health',(req,res)=>res.json({ok:true,name:'NovaPulse',messaging:'socket.io'}));

app.post('/api/auth/register',(req,res)=>{
 const {name,handle,email,password}=req.body||{};
 if(!name||!handle||!email||!password)return res.status(400).json({error:'All fields are required'});
 if(password.length<8)return res.status(400).json({error:'Password must be at least 8 characters'});
 try{const hash=bcrypt.hashSync(password,10);const info=db.prepare('INSERT INTO users(name,handle,email,password) VALUES(?,?,?,?)').run(name,handle.replace(/^@/,''),email.toLowerCase(),hash);const u=publicUser(info.lastInsertRowid);res.json({token:sign(u),user:u})}
 catch(e){res.status(409).json({error:'Email or handle already exists'})}
});
app.post('/api/auth/login',(req,res)=>{
 const {email,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE email=?').get((email||'').toLowerCase());
 if(!u||!bcrypt.compareSync(password||'',u.password))return res.status(401).json({error:'Invalid email or password'});
 res.json({token:sign(u),user:publicUser(u.id)});
});
app.get('/api/me',auth,(req,res)=>res.json(publicUser(req.user.id)));

function feed(me){return db.prepare(`SELECT p.id,p.body,p.created_at,u.id user_id,u.name,u.handle,u.avatar,
(SELECT count(*) FROM likes l WHERE l.post_id=p.id) likes,(SELECT count(*) FROM reposts r WHERE r.post_id=p.id) reposts,
EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=?) liked,
EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id=p.id AND b.user_id=?) bookmarked
FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100`).all(me,me)}
app.get('/api/feed',auth,(req,res)=>res.json(feed(req.user.id)));
app.post('/api/posts',auth,(req,res)=>{const body=(req.body?.body||'').trim();if(!body||body.length>1000)return res.status(400).json({error:'Post must be 1–1000 characters'});const x=db.prepare('INSERT INTO posts(user_id,body) VALUES(?,?)').run(req.user.id,body);res.json({id:x.lastInsertRowid})});

for(const [path,table] of [['like','likes'],['repost','reposts'],['bookmark','bookmarks']])app.post(`/api/posts/:id/${path}`,auth,(req,res)=>{const e=db.prepare(`SELECT 1 FROM ${table} WHERE user_id=? AND post_id=?`).get(req.user.id,req.params.id);if(e)db.prepare(`DELETE FROM ${table} WHERE user_id=? AND post_id=?`).run(req.user.id,req.params.id);else db.prepare(`INSERT OR IGNORE INTO ${table}(user_id,post_id) VALUES(?,?)`).run(req.user.id,req.params.id);res.json({active:!e})});

app.post('/api/users/:id/follow',auth,(req,res)=>{const id=Number(req.params.id);if(id===req.user.id)return res.status(400).json({error:'Cannot follow yourself'});const e=db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').get(req.user.id,id);if(e)db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.user.id,id);else db.prepare('INSERT OR IGNORE INTO follows(follower_id,following_id) VALUES(?,?)').run(req.user.id,id);res.json({following:!e})});
app.get('/api/search',auth,(req,res)=>{const q=`%${(req.query.q||'').replace(/[%_]/g,'')}%`;res.json(db.prepare('SELECT id,name,handle,bio,avatar FROM users WHERE name LIKE ? OR handle LIKE ? LIMIT 30').all(q,q))});

app.get('/api/users',auth,(req,res)=>res.json(db.prepare('SELECT id,name,handle,avatar,bio FROM users WHERE id<>? ORDER BY id DESC LIMIT 50').all(req.user.id)));
app.get('/api/messages/:userId',auth,(req,res)=>{
 const other=Number(req.params.userId);
 const rows=db.prepare(`SELECT m.id,m.sender_id,m.receiver_id,m.body,m.created_at,m.read_at,u.name sender_name,u.handle sender_handle
 FROM messages m JOIN users u ON u.id=m.sender_id
 WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
 ORDER BY m.created_at ASC LIMIT 500`).all(req.user.id,other,other,req.user.id);
 db.prepare('UPDATE messages SET read_at=CURRENT_TIMESTAMP WHERE sender_id=? AND receiver_id=? AND read_at IS NULL').run(other,req.user.id);
 res.json(rows);
});

function saveMessage(sender,receiver,body){
 const b=(body||'').trim();if(!b||b.length>2000)throw Error('Message must be 1–2000 characters');
 const x=db.prepare('INSERT INTO messages(sender_id,receiver_id,body) VALUES(?,?,?)').run(sender,receiver,b);
 return db.prepare(`SELECT m.*,u.name sender_name,u.handle sender_handle FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?`).get(x.lastInsertRowid);
}

io.use((socket,next)=>{try{const u=verify(socket.handshake.auth?.token);socket.user=u;next()}catch(e){next(new Error('Authentication required'))}});
io.on('connection',socket=>{
 socket.join(`user:${socket.user.id}`);
 socket.on('message:send',(data,ack)=>{
   try{
    const receiver=Number(data.receiverId); if(!receiver||receiver===socket.user.id)throw Error('Invalid recipient');
    const m=saveMessage(socket.user.id,receiver,data.body);
    io.to(`user:${receiver}`).emit('message:new',m);socket.emit('message:new',m);
    if(ack)ack({ok:true,message:m});
   }catch(e){if(ack)ack({ok:false,error:e.message})}
 });
 socket.on('message:typing',data=>{const receiver=Number(data.receiverId);if(receiver)io.to(`user:${receiver}`).emit('message:typing',{fromId:socket.user.id,typing:!!data.typing})});
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`NovaPulse API + realtime messaging on ${PORT}`));
