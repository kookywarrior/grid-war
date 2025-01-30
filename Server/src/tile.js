class Tile {
	constructor(sid, value, x, y) {
		this.sid = sid
		this.value = value
		this.x = x
		this.y = y
		this.active = true
		this.sentTo = new Map()
		this.sentToPos = new Map()
	}

	activate(value, x, y) {
		this.active = true
		this.value = value
		this.x = x
		this.y = y
		this.sentTo = new Map()
		this.sentToPos = new Map()
	}

	update(x, y) {
		this.x = x
		this.y = y
		this.sentToPos = new Map()
	}

	deactivate() {
		this.active = false
	}

	getTileSendData(type, data = {}) {
		if (type === "addTile" || type === "showTile") {
			return {
				type: type,
				data: {
					sid: this.sid,
					value: this.value,
					x: this.x,
					y: this.y,
					borderId: data.borderId
				}
			}
		} else if (type === "removeTile") { 
			return {
				type: "removeTile",
				data: {
					sid: this.sid
				}
			}
		} else if (type === "updateTile") {
			return {
				type: "updateTile",
				data: {
					sid: this.sid,
					x: this.x,
					y: this.y,
				}
			}
		} else if (type === "slideTile") {
			return {
				type: "slideTile",
				data: {
					sid: this.sid,
					x: data.x,
					y: data.y
				}
			}
		}

		/*
		{
			type: "mergeTile",
			data: {
				sid1: 1,
				sid2: 2,
				merge: null | 3,
				value: newValue,
				x: pos.x,
				y: pos.y,
				borderId: this.id
			}
		}
		*/
	}
}

export default Tile
