module.exports = function (req, res, d) {
	res.writeHeader(200,{
		"Cache-Control": "no-store",
		"Content-Type": "text/event-stream"
	})
	process.on("refresh", () => {
		res.write("data: "+d.version+"\n\n")
		setTimeout(() => res.end(), 0);
	})
	res.write("retry: 30000\n\n");
}