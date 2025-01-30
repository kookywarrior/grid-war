import { generateUsername } from "unique-username-generator"
import util from "./util.js"

const moves = ["top", "bottom", "left", "right"]

class Bot {
	constructor(id, borderManager, rate) {
		this.id = id
		this.borderManager = borderManager
		this.isBot = true
		this.me = null
		this.changeName()
		this.spawn()
		setInterval(() => {
			if (!this.me.alive) {
				this.spawn()
			} else {
				for (let i = 0; i < util.randomInteger(1, rate[2]); i++) this.move()
			}
		}, util.randomInteger(rate[0], rate[1]))
	}

	changeName() {
		this.name = generateUsername(Math.random() < 0.1 ? " " : "", Math.random() < 0.01 ? util.randomInteger(1, 3) : 0, util.randomInteger(4, 15))
	}

	spawn() {
		if (Math.random() < 0.05) this.changeName()
		this.me = this.borderManager.spawnBorder(this.id, this.name)
	}

	move() {
		this.borderManager.queueMove(this.id, moves[util.randomInteger(0, 3)])
	}
}

export default Bot
