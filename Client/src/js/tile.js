class Tile {
	constructor(sid) {
		this.sid = sid
		this.active = false
		this.mergedTiles = []
		this.scale = 0
		this.opacity = 0
	}

	spawn(value, x, y, borderId, animate, mergedTiles = []) {
		this.value = value
		this.x = x
		this.y = y
		this.x2 = x
		this.y2 = y
		this.borderId = borderId
		this.border = null
		this.active = true

		const bgLightness = 100 - Math.log2(this.value) * 8
		const textLightness = bgLightness <= 50 ? 90 : 10
		this.bgColour = `hsl(${(borderId === window.myId) || borderId === "a" ? 200 : 0}, 50%, ${bgLightness}%)`
		this.textColour = `hsl(${(borderId === window.myId) || borderId === "a" ? 200 : 0}, 25%, ${textLightness}%)`

		if (animate) {
			this.scale = 0
			this.opacity = 0
			this.scaleStartTime = null
		} else if (mergedTiles.length === 2) {
			this.scale = 1
			this.opacity = 0
			this.mergedTiles = mergedTiles
		} else {
			this.scale = 1
			this.opacity = 1
		}
		this.opacityStartTime = null
	}

	update(x, y, animate) {
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
}

export default Tile
