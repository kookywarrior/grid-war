const path = require("path")

module.exports = {
	entry: "./src/js/index.js",
	mode: "production",
	output: {
		filename: "build.js",
		path: path.resolve(__dirname, "src/js")
	}
}
