#! /usr/bin/env node

const fs = require("fs")
const http = require("http")
const path = require("path")
const mime = require("./mime")

const port = process.env.PORT || 3000;
const root = path.join(path.resolve(), process.argv[2] || "");
const dl = process.env.SCREEN_WIDTH || 46; 
http.createServer((req, res) => {
	let {url, method} = req;
	if(method !== "GET") return res.end();
	if(url == "/es") return require("./eventSource")(req, res,d)
	log(req, res);
	let uri = path.join(root, url)
	if(!fs.existsSync(uri))
		return r404(res);
	return send(res, uri)
})
.listen(port, () =>{
	console.log(h1("Server is online at localhost:"+ port));
})

function r404 (res) {
	res.writeHead(404);
	res.end()
}

function send(res, file) {
	file = file.split("?")[0];
	if(!fs.existsSync(file))
		return r404(res);
	let stat = fs.statSync(file);
	if(stat.isDirectory())
		return send(res, path.join(file, "index.html"))
	let ext = file.split(".").at(-1).split("?")[0];
	let type = mime.getType(ext) || "octet/stream";
	
	res.writeHead(200, {
		"Content-Type" : type,
		"Content-Length": file.endsWith("index.html") ? stat.size+injection.length : stat.size
	});
	
	if(file.endsWith("index.html")) {
		return fs.readFile(file, (e, d) => {
			let txt = d.toString()
			let html = txt.slice(0, txt.indexOf("</html>")) +
				injection + txt.slice(txt.indexOf("</html>"))
			res.end(html);
		})
	}
	fs.createReadStream(file)
	.pipe(res);
}

function log(req, res) {
	let it = performance.now()
	res.on("finish", () => {
		let te = (performance.now() -it).toFixed(2)+"ms"
		console.log(req.method, res.statusCode, te, req.url)
	})
}

function watch(dirs, cb) {
	for (let dir of dirs) {
		fs.watch(dir, cb);
		let files = fs.readdirSync(dir);
		for (let file of files) {
			file = path.join(dir, file);
			let stat = fs.statSync(file);
			if (stat.isDirectory()) watch([file], cb);
		}
	}
}

const d = {version: 0}
let lu=0;
watch([root], (e,f) => {
	let now  = performance.now()
	if(now-lu<100) return;
	d.version += 1
	process.emit("refresh")
	console.log(h1("REFRESH : "+f))
	lu = now;
})

function h1 (txt) {
	let p = Math.floor((dl - txt.length)/2);
	let p1 = p-1;
	let p2 = txt.length % 2 == 0 ? p-1 : p;
	let str = ("-".repeat(p1)) +"|"+ txt +"|"+ ("-".repeat(p2))
	return str
}

const injection = `
<!-- Injection For Live-Reload -->
<script type="text/javascript" >
const es = new EventSource("/es")
!sessionStorage.getItem("version") && sessionStorage.setItem("version", 0);
es.onmessage= e => {
	let version = sessionStorage.getItem("version")
	let d=parseInt(e.data)
	if(d == version) return
	sessionStorage.setItem("version", d)
	location.href = location.href
}
</script>
<!-- Injection END-->
`