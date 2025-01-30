const util = {
	getDistance: (x1, y1, x2, y2) => Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2),
	getDirection: (x1, y1, x2, y2) => Math.atan2(y1 - y2, x1 - x2),
	randomInteger: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
	randomString: (length, characters) => {
		let result = ""
		for (let i = 0; i < length; i++) {
			result += characters[Math.floor(Math.random() * characters.length)]
		}
		return result
	},
	shuffleArray: (array) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[array[i], array[j]] = [array[j], array[i]]
		}
	},
	createWeightArray: (array) => {
		const weightedArray = []
		for (let i = 0; i < array.length; i++) {
			for (let j = 0; j < i + 1; j++) {
				weightedArray.push(array[i])
			}
		}
		return weightedArray
	},
	kFormat: (num) => {
		return num > 999 ? (num / 1000).toFixed(1) + "k" : num
	},
	nextElement: (array, currentElement) => {
		return array[(array.indexOf(currentElement) + 1) % array.length]
	}
}

export default util
