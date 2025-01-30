export default {
	randomString: (length, characters) => {
		let result = ""
		for (let i = 0; i < length; i++) {
			result += characters[Math.floor(Math.random() * characters.length)]
		}
		return result
	},
	randomInteger: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}
}
