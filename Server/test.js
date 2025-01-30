class TileManager {
	constructor(server) {
		this.sidCount = 1
		this.server = server
		this.tiles = []
	}

	findTile(sid) {
		for (const tile of this.tiles) {
			if (tile.sid === sid) {
				return tile
			}
		}
		return null
	}

	addTile(value, x, y) {
		for (const tmpTile of this.tiles) {
			if (!tmpTile.active) {
				tmpTile.activate(value, x, y)
				return tmpTile
			}
		}

		const tile = new Tile(this.sidCount, value, x, y)
		this.sidCount++
		this.tiles.push(tile)

		return tile
	}

	removeTile(tile) {
		tile.deactivate()
	}
}

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
					y: this.y
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

const tileManager = new TileManager()

const matrix = [
	[tileManager.addTile(4, 0, 0), null, null, tileManager.addTile(2, 3, 0)],
	[tileManager.addTile(2, 0, 1), null, null, null],
	[null, null, null, null],
	[null, null, null, null]
]

function transpose() {
	for (let i = 0; i < matrix.length; i++) {
		for (let j = i + 1; j < matrix[i].length; j++) {
			// Swap tiles[i][j] with tiles[j][i]
			let temp = matrix[i][j]
			matrix[i][j] = matrix[j][i]
			matrix[j][i] = temp
		}
	}
}

function reverse() {
	for (let i = 0; i < matrix.length; i++) {
		matrix[i].reverse()
	}
}

function calcPosition(position, rowIndex, direction) {
	const pos = {
		x: null,
		y: null
	}

	if (direction === "left") {
		pos.x = position
		pos.y = rowIndex
	} else if (direction === "right") {
		pos.x = 4 - position - 1
		pos.y = rowIndex
	} else if (direction === "top") {
		pos.x = rowIndex
		pos.y = position
	} else if (direction === "bottom") {
		pos.x = rowIndex
		pos.y = 4 - position - 1
	}

	return pos
}

function moveTiles(direction, borders = []) {
	let messages = []

	// Prepare tiles based on direction
	if (direction === "left") {
	} else if (direction === "right") {
		reverse()
	} else if (direction === "top") {
		transpose()
	} else if (direction === "bottom") {
		transpose()
		reverse()
	}

	// slide and merge each row
	for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
		const tiles = matrix[rowIndex]

		// Omit nulls (simulate sliding)
		let insertPos = 0
		for (let i = 0; i < tiles.length; i++) {
			if (tiles[i] !== null) {
				if (i !== insertPos) {
					const pos = calcPosition(insertPos, rowIndex, direction)

					const recipient = []
					for (const tmpBorder of borders) {
						if (tmpBorder.active && tmpBorder.canSee(this)) {
							if (tiles[i].sentTo.has(tmpBorder.id) && tiles[i].sentToPos.has(tmpBorder.id)) {
								recipient.push(tmpBorder.id)
							}
						}
					}
					messages.push({
						msg: tiles[i].getTileSendData("slideTile", { x: pos.x, y: pos.y }),
						recipient: recipient
					})

					tiles[i].update(pos.x, pos.y)
					for (const tmpBorderId of recipient) {
						tiles[i].sentToPos.set(tmpBorderId, true)
					}
					tiles[insertPos] = tiles[i]
					tiles[i] = null
				}
				insertPos++
			}
		}

		// Merge tiles
		for (let i = 0; i < tiles.length - 1; i++) {
			if (tiles[i] && tiles[i + 1] && tiles[i].value === tiles[i + 1].value) {
				let newMergedTile = null
				let newValue = tiles[i].value * 2
				const pos = calcPosition(i, rowIndex, direction)

				if (newValue !== 2048) {
					newMergedTile = tileManager.addTile(newValue, pos.x, pos.y)
					// addScore(tiles[i].value)
				} else {
					// addScore(newValue)
				}

				const canSeeRecipient = []
				const cannotSeeRecipient = []
				for (const tmpBorder of borders) {
					if (tmpBorder.active) {
						if (
							tmpBorder.canSee(this) &&
							tiles[i].sentTo.has(tmpBorder.id) &&
							tiles[i].sentToPos.has(tmpBorder.id) &&
							tiles[i + 1].sentTo.has(tmpBorder.id) &&
							tiles[i + 1].sentToPos.has(tmpBorder.id)
						) {
							canSeeRecipient.push(tmpBorder.id)
						} else {
							cannotSeeRecipient.push(tmpBorder.id)
						}
					}
				}

				messages.push({
					msg: {
						type: "mergeTile",
						data: {
							sid1: tiles[i].sid,
							sid2: tiles[i + 1].sid,
							merge: newMergedTile !== null ? newMergedTile.sid : null,
							x: pos.x,
							y: pos.y,
							value: newValue,
							borderId: "abc"
						}
					},
					recipient: canSeeRecipient
				})
				messages.push({
					msg: tiles[i].getTileSendData("removeTile"),
					recipient: cannotSeeRecipient
				})
				messages.push({
					msg: tiles[i + 1].getTileSendData("removeTile"),
					recipient: cannotSeeRecipient
				})

				if (newMergedTile !== null) {
					for (const tmpBorderId of canSeeRecipient) {
						newMergedTile.sentTo.set(tmpBorderId, true)
						newMergedTile.sentToPos.set(tmpBorderId, true)
					}
				}

				// remove slide message associated with sid1 & sid2
				for (let j = 0; j < messages.length; j++) {
					if (messages[j].msg.type === "slideTile" && (messages[j].msg.data.sid === tiles[i].sid || messages[j].msg.data.sid === tiles[i + 1].sid)) {
						messages.splice(j, 1)
						j--
					}
				}

				tileManager.removeTile(tiles[i])
				tileManager.removeTile(tiles[i + 1])
				tiles[i] = newMergedTile
				tiles[i + 1] = null
			}
		}

		// Slide again after merging
		insertPos = 0
		for (let i = 0; i < tiles.length; i++) {
			if (tiles[i] !== null) {
				if (i !== insertPos) {
					const pos = calcPosition(insertPos, rowIndex, direction)
					const recipient = []
					for (const tmpBorder of borders) {
						if (tmpBorder.active && tmpBorder.canSee(this)) {
							if (tiles[i].sentTo.has(tmpBorder.id) && tiles[i].sentToPos.has(tmpBorder.id)) {
								recipient.push(tmpBorder.id)
							}
						}
					}

					// check if tile is just merged
					let tileIsMerged = false
					for (let j = 0; j < messages.length; j++) {
						if (messages[j].msg.type === "mergeTile" && messages[j].msg.data.merge === tiles[i].sid) {
							messages[j].msg.data.x = pos.x
							messages[j].msg.data.y = pos.y
							tileIsMerged = true
							break
						}
					}

					if (!tileIsMerged) {
						messages.push({
							msg: tiles[i].getTileSendData("slideTile", { x: pos.x, y: pos.y }),
							recipient: recipient
						})
					}

					tiles[i].update(pos.x, pos.y)
					for (const tmpBorderId of recipient) {
						tiles[i].sentToPos.set(tmpBorderId, true)
					}
					tiles[insertPos] = tiles[i]
					tiles[i] = null
				}
				insertPos++
			}
		}
	}

	// Reset tiles based on direction
	if (direction === "left") {
	} else if (direction === "right") {
		reverse()
	} else if (direction === "top") {
		transpose()
	} else if (direction === "bottom") {
		reverse()
		transpose()
	}

	return messages
}