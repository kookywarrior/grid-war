import config from "./config.js"
import util from "./util.js"

class Border {
	constructor(id, tileManager) {
		this.id = id
		this.tileManager = tileManager
		this.server = tileManager.server
		this.alive = false
		this.active = false
		this.width = config.borderSize
		this.height = config.borderSize
		this.tiles = []
		this.moveQueue = []
		this.isAnimating = false
		this.sentTo = new Map()
		this.sentToPos = new Map()
	}

	spawn(x, y, name) {
		this.alive = true
		this.active = true
		this.x = x
		this.y = y
		this.name = name
		this.score = 0
		this.moveQueue = []
		this.isAnimating = false
		this.addScore(0)

		this.tiles = []
		for (let i = 0; i < this.width; i++) {
			this.tiles[i] = []
			for (let j = 0; j < this.height; j++) {
				this.tiles[i][j] = null
			}
		}

		this.sentTo = new Map()
		this.sentToPos = new Map()
	}

	kill(border) {
		this.alive = false
		for (const tileRow of this.tiles) {
			for (const tile of tileRow) {
				if (tile) {
					if (border) {
						border.addScore(tile.value)
					}
					this.tileManager.removeTile(tile)
					this.server.sendAll(tile.getTileSendData("removeTile"))
				}
			}
		}

		this.server.sendAll(this.getBorderSendData("killBorder"))
	}

	update(x, y) {
		this.x = x
		this.y = y
		this.sentToPos = new Map()
	}

	addScore(value) {
		this.score += value

		this.server.send(this.id, {
			type: "score",
			data: {
				score: this.score
			}
		})
	}

	transpose() {
		for (let i = 0; i < this.tiles.length; i++) {
			for (let j = i + 1; j < this.tiles[i].length; j++) {
				// Swap tiles[i][j] with tiles[j][i]
				const temp = this.tiles[i][j]
				this.tiles[i][j] = this.tiles[j][i]
				this.tiles[j][i] = temp
			}
		}
	}

	reverse() {
		for (let i = 0; i < this.tiles.length; i++) {
			this.tiles[i].reverse()
		}
	}

	calcPosition(position, rowIndex, direction) {
		const pos = {
			x: null,
			y: null
		}

		if (direction === "left") {
			pos.x = position
			pos.y = rowIndex
		} else if (direction === "right") {
			pos.x = this.width - position - 1
			pos.y = rowIndex
		} else if (direction === "top") {
			pos.x = rowIndex
			pos.y = position
		} else if (direction === "bottom") {
			pos.x = rowIndex
			pos.y = this.height - position - 1
		}

		return pos
	}

	moveTiles(direction, borders) {
		let messages = []

		// Prepare tiles based on direction
		if (direction === "left") {
		} else if (direction === "right") {
			this.reverse()
		} else if (direction === "top") {
			this.transpose()
		} else if (direction === "bottom") {
			this.transpose()
			this.reverse()
		}

		// slide and merge each row
		for (let rowIndex = 0; rowIndex < this.tiles.length; rowIndex++) {
			const tiles = this.tiles[rowIndex]

			// Omit nulls (simulate sliding)
			let insertPos = 0
			for (let i = 0; i < tiles.length; i++) {
				if (tiles[i] !== null) {
					if (i !== insertPos) {
						const pos = this.calcPosition(insertPos, rowIndex, direction)

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
					const pos = this.calcPosition(i, rowIndex, direction)

					if (newValue !== 2048) {
						newMergedTile = this.tileManager.addTile(newValue, pos.x, pos.y)
						this.addScore(tiles[i].value)
					} else {
						this.addScore(newValue)
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
								borderId: this.id
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

					this.tileManager.removeTile(tiles[i])
					this.tileManager.removeTile(tiles[i + 1])
					tiles[i] = newMergedTile
					tiles[i + 1] = null
				}
			}

			// Slide again after merging
			insertPos = 0
			for (let i = 0; i < tiles.length; i++) {
				if (tiles[i] !== null) {
					if (i !== insertPos) {
						const pos = this.calcPosition(insertPos, rowIndex, direction)
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
			this.reverse()
		} else if (direction === "top") {
			this.transpose()
		} else if (direction === "bottom") {
			this.reverse()
			this.transpose()
		}

		return messages
	}

	calcMoveBorderPosition(direction) {
		const pos = {
			x: 0,
			y: 0
		}

		if (direction === "left") {
			pos.x -= 1
		} else if (direction === "right") {
			pos.x += 1
		} else if (direction === "top") {
			pos.y -= 1
		} else if (direction === "bottom") {
			pos.y += 1
		}

		return pos
	}

	checkOverMap(x, y) {
		if (this.x + x < 0 || this.y + y < 0 || this.x + x + this.width > config.mapSize || this.y + y + this.height > config.mapSize) {
			return true
		}

		return false
	}

	checkBorderCollision(border, x, y) {
		const overlapX = this.x + x < border.x + border.width && this.x + x + this.width > border.x
		const overlapY = this.y + y < border.y + border.height && this.y + y + this.height > border.y

		if (!overlapX || !overlapY) {
			return false
		}

		return true
	}

	checkTilesCollision(border, x, y) {
		const border1CollidedTiles = []
		const border2CollidedTiles = []

		// Loop through the tiles of the first border
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				// Calculate global positions of the tile in border1
				const globalX1 = this.x + x + j
				const globalY1 = this.y + y + i

				// Calculate local positions of the tile in border2
				const localX2 = globalX1 - border.x
				const localY2 = globalY1 - border.y

				// Check if the positions fall within the bounds of border2
				if (localX2 >= 0 && localX2 < border.width && localY2 >= 0 && localY2 < border.height) {
					// Check if both tiles are non-null
					const tile1 = this.tiles[i][j]
					const tile2 = border.tiles[localY2][localX2]
					if (tile1 !== null && tile2 !== null) {
						border1CollidedTiles.push(tile1)
						border2CollidedTiles.push(tile2)
					}
				}
			}
		}

		if (border1CollidedTiles.length === 0 || border2CollidedTiles.length === 0) {
			return false
		}

		let canColide = true
		for (let i = 0; i < border1CollidedTiles.length; i++) {
			const border1Tile = border1CollidedTiles[i]
			const border2Tile = border2CollidedTiles[i]

			if (border1Tile.value <= border2Tile.value) {
				canColide = false
				break
			}
		}

		return canColide
	}

	getEmptyTiles() {
		const references = []

		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				if (this.tiles[i][j] === null) {
					references.push({ x: j, y: i })
				}
			}
		}

		return references
	}

	possibleMerges() {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				const tile = this.tiles[i][j]
				if (tile !== null) {
					// Check right neighbour
					if (i + 1 < this.width && this.tiles[i + 1][j] && this.tiles[i + 1][j].value === tile.value) {
						return true
					}

					// Check down neighbour
					if (j + 1 < this.height && this.tiles[i][j + 1] && this.tiles[i][j + 1].value === tile.value) {
						return true
					}
				}
			}
		}
		return false
	}

	generateTile(emptyTiles, value) {
		const randomIndex = util.randomInteger(0, emptyTiles.length - 1)
		const tile = this.tileManager.addTile(value, emptyTiles[randomIndex].x, emptyTiles[randomIndex].y)
		this.tiles[emptyTiles[randomIndex].y][emptyTiles[randomIndex].x] = tile
		return tile
	}

	canSee(tmpObj) {
		const X = this.x - config.sightWidth / 2
		const Y = this.y - config.sightHeight / 2

		return tmpObj.x >= X && tmpObj.x <= X + config.sightWidth && tmpObj.y >= Y && tmpObj.y <= Y + config.sightHeight
	}

	getBorderSendData(type) {
		if (type === "addBorder") {
			return {
				type: "addBorder",
				data: {
					id: this.id,
					x: this.x,
					y: this.y,
					name: this.name,
					score: this.score
				}
			}
		} else if (type === "removeBorder" || type === "killBorder") {
			return {
				type: type,
				data: {
					id: this.id
				}
			}
		} else if (type === "updateBorder" || type === "slideBorder") {
			return {
				type: type,
				data: {
					id: this.id,
					x: this.x,
					y: this.y
				}
			}
		}
	}
}

export default Border
