import Border from "./border.js"

class BorderManager {
	constructor() {
		this.borders = []
	}

	findBorder(id) {
		for (const border of this.borders) {
			if (border.id === id) {
				return border
			}
		}
		return null
	}

	spawnBorder(id, name, x, y, score) {
		let border = this.findBorder(id)
		if (border) {
		} else {
			for (const tmpBorder of this.borders) {
				if (!tmpBorder.active) {
					border = tmpBorder
					border.id = id
					break
				}
			}

			if (!border) {
				border = new Border(id)
				this.borders.push(border)
			}
        }
        
		border.spawn(x, y, name, score)

		return border
	}

	killBorder(id) {
		const border = this.findBorder(id)
		if (border) {
			border.alive = false
		}
	}

	removeBorder(id) {
		const border = this.findBorder(id)
		if (border) {
			border.active = false
		}
	}

	updateBorder(id, x, y, animate) {
		const border = this.findBorder(id)
		if (border) {
			border.update(x, y, animate)
		}
	}
}

export default BorderManager
