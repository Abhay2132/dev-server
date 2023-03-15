const mime = {
	"html" : "text/html",
	"css" : "text/css",
	"txt" : "text/plain",
	"js" : "application/javaScript",
}

module.exports = {
	getType(ext){
		return !!mime[ext] ? mime[ext] : "octet/stream"
	}
}