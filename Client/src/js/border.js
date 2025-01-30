import config from "./config.js"

class Border {
	constructor(id) {
		this.id = id
		this.active = false
		this.alive = false
		this.width = config.borderSize
		this.height = config.borderSize
		this.wiggle = 0
		this.xWiggle = 0
		this.yWiggle = 0
	}

	spawn(x, y, name, score) {
		this.active = true
		this.alive = true
		this.x = x
		this.y = y
		this.x2 = x
		this.y2 = y
		this.name = name
		this.score = score
		this.targetScore = score
		this.wiggle = 0
		this.xWiggle = 0
		this.yWiggle = 0
	}

	shake(direction) {
		if (direction === "left") {
			this.xWiggle = -1
			this.yWiggle = 0
		} else if (direction === "right") {
			this.xWiggle = 1
			this.yWiggle = 0
		} else if (direction === "top") {
			this.xWiggle = 0
			this.yWiggle = -1
		} else if (direction === "bottom") {
			this.xWiggle = 0
			this.yWiggle = 1
		}
		window.myBorder.wiggle = config.wiggleSize
	}

	update(x, y, animate) {
		this.wiggle = 0
		this.x2 = x
		this.y2 = y

		if (animate) {
			this.x1 = this.x
			this.y1 = this.y
			this.startTime = null
		} else {
			this.x = x
			this.y = y
		}
	}

	updateScore(score) {
		this.targetScore = score

		if (score === 0) {
			this.score = 0
			document.getElementById("scoreDisplay").textContent = "Score: " + this.score
		}
	}
}

export default Border
