import Border from "./border.js"
import config from "./config.js"
import util from "./util.js"

class BorderManager {
	constructor(tileManager) {
		this.borders = []
		this.tileManager = tileManager
		this.server = tileManager.server
	}

	findBorder(id) {
		for (const border of this.borders) {
			if (border.id === id) {
				return border
			}
		}
		return null
	}

	spawnBorder(id, name) {
		let border = this.findBorder(id)
		if (border) {
			if (border.alive) return
		} else {
			for (const tmpBorder of this.borders) {
				if (!tmpBorder.active) {
					border = tmpBorder
					border.id = id
					break
				}
			}

			if (!border) {
				border = new Border(id, this.tileManager)
				this.borders.push(border)
			}
		}

		name = name.trim()
		name = name.substring(0, config.maxNameLength)
		for (let i = 0; i < name.length; i++) {
			if (config.nameStrings.includes(name[i])) continue
			name = name.substring(0, i) + name.substring(i + 1)
		}
		if (name.length === 0) name = "unknown"

		let spawnX, spawnY
		while (true) {
			spawnX = util.randomInteger(0, config.mapSize - config.borderSize)
			spawnY = util.randomInteger(0, config.mapSize - config.borderSize)

			let borderCollition = false
			for (const tmpBorder of this.borders) {
				if (tmpBorder.active && tmpBorder.alive) {
					border.x = spawnX
					border.y = spawnY
					if (border.checkBorderCollision(tmpBorder, 0, 0)) {
						borderCollition = true
						break
					}
				}
			}

			if (!borderCollition) {
				break
			}
		}

		border.spawn(spawnX, spawnY, name)

		// generate tiles
		const emptyTiles = border.getEmptyTiles()
		border.generateTile(emptyTiles, 2)
		const emptyTiles2 = border.getEmptyTiles()
		border.generateTile(emptyTiles2, 2)

		this.sendBorder(border, true)
		this.updateLeaderboard()

		return border
	}

	removeBorder(id) {
		const border = this.findBorder(id)
		if (border) {
			border.active = false
			this.server.sendAll(border.getBorderSendData("removeBorder"))
			this.updateLeaderboard()
		}
	}

	queueMove(id, direction) {
		const border = this.findBorder(id)
		if (border && border.active && border.alive) {
			border.moveQueue.push(direction)
			this.processNextMove(border)
		}
	}

	processNextMove(border) {
		if (border.isAnimating || border.moveQueue.length === 0) return

		border.isAnimating = true
		const move = border.moveQueue.shift()
		this.moveBorder(border, move)
	}

	moveBorder(border, direction) {
		if (border.active && border.alive) {
			const movePosition = border.calcMoveBorderPosition(direction)
			let borderCanMove = false
			let collideWith = null

			// check if border move over map boundary
			if (!border.checkOverMap(movePosition.x, movePosition.y)) {
				borderCanMove = true

				// check if border collide with other border
				for (const otherBorder of this.borders) {
					if (otherBorder.alive && otherBorder.id !== border.id) {
						if (border.checkBorderCollision(otherBorder, movePosition.x, movePosition.y)) {
							collideWith = otherBorder
							borderCanMove = border.checkTilesCollision(otherBorder, movePosition.x, movePosition.y)
							break
						}
					}
				}
			}

			// move tiles
			const messages = border.moveTiles(direction, this.borders)

			if (messages.length === 0) {
				this.server.send(border.id, {
					type: "invalidMove",
					data: {
						direction: direction
					}
				})
				border.moveQueue = []
			} else {
				for (const message of messages) {
					for (const tmpBorderId of message.recipient) {
						this.server.send(tmpBorderId, message.msg)
					}
				}

				if (borderCanMove) {
					const newPos = {
						x: border.x + movePosition.x,
						y: border.y + movePosition.y
					}
					border.update(newPos.x, newPos.y)

					this.sendBorder(border)

					if (collideWith) {
						collideWith.kill(border)
					}
				}
			}

			const emptyTiles = border.getEmptyTiles()
			if (emptyTiles.length !== 0 && messages.length > 0) {
				// generate tile
				const generatedTile = border.generateTile(emptyTiles, Math.random() < 0.9 ? 2 : 4)

				for (const tmpBorder of this.borders) {
					if (tmpBorder.active) {
						if (tmpBorder.canSee(border)) {
							generatedTile.sentTo.set(tmpBorder.id, true)
							generatedTile.sentToPos.set(tmpBorder.id, true)
							this.server.send(tmpBorder.id, generatedTile.getTileSendData("showTile", { borderId: border.id }))
						}
					}
				}

				// check if alive
				if (border.getEmptyTiles().length === 0 && !border.possibleMerges()) {
					border.kill()
				}
			}

			this.updateLeaderboard()
		}

		const self = this
		setTimeout(() => {
			border.isAnimating = false
			self.processNextMove(border)
		}, 100)
	}

	sendBorder(border, isSpawn = false) {
		for (const tmpBorder of this.borders) {
			if (tmpBorder.active) {
				if (tmpBorder.canSee(border)) {
					// if border haven't sent to tmpBorder
					if (!border.sentTo.has(tmpBorder.id)) {
						border.sentTo.set(tmpBorder.id, true)
						border.sentToPos.set(tmpBorder.id, true)
						this.server.send(tmpBorder.id, border.getBorderSendData("addBorder"))
					}

					// if tmpBorder havent sent to border (if myself, no need)
					if (tmpBorder.id !== border.id && !tmpBorder.sentTo.has(border.id)) {
						tmpBorder.sentTo.set(border.id, true)
						tmpBorder.sentToPos.set(border.id, true)
						this.server.send(border.id, tmpBorder.getBorderSendData("addBorder"))
					}

					// send border position to tmpBorder
					if (!isSpawn) {
						border.sentToPos.set(tmpBorder.id, true)
						this.server.send(tmpBorder.id, border.getBorderSendData("slideBorder"))
					}

					// if tmpBorder haven't sent position to border (if myself, no need)
					if (tmpBorder.id !== border.id && !tmpBorder.sentToPos.has(border.id)) {
						tmpBorder.sentToPos.set(border.id, true)
						this.server.send(border.id, tmpBorder.getBorderSendData("updateBorder"))
					}

					// if border tiles haven't sent to tmpBorder
					// if border tiles haven't sent position to tmpBorder
					for (let i = 0; i < border.tiles.length; i++) {
						for (let j = 0; j < border.tiles[i].length; j++) {
							const tile = border.tiles[i][j]
							if (tile !== null && tile.active) {
								if (!tile.sentTo.has(tmpBorder.id)) {
									tile.sentTo.set(tmpBorder.id, true)
									tile.sentToPos.set(tmpBorder.id, true)
									this.server.send(tmpBorder.id, tile.getTileSendData("addTile", { borderId: border.id }))
								} else if (!tile.sentToPos.has(tmpBorder.id)) {
									tile.sentToPos.set(tmpBorder.id, true)
									this.server.send(tmpBorder.id, tile.getTileSendData("updateTile", { borderId: border.id }))
								}
							}
						}
					}

					// if tmpBorder tiles haven't sent to border (if myself, no need)
					// if tmpBorder tiles haven't sent position to border (if myself, no need)
					if (tmpBorder.id !== border.id) {
						for (let i = 0; i < tmpBorder.tiles.length; i++) {
							for (let j = 0; j < tmpBorder.tiles[i].length; j++) {
								const tile = tmpBorder.tiles[i][j]
								if (tile !== null && tile.active) {
									if (!tile.sentTo.has(border.id)) {
										tile.sentTo.set(border.id, true)
										tile.sentToPos.set(border.id, true)
										this.server.send(border.id, tile.getTileSendData("addTile", { borderId: tmpBorder.id }))
									} else if (!tile.sentToPos.has(border.id)) {
										tile.sentToPos.set(border.id, true)
										this.server.send(border.id, tile.getTileSendData("updateTile", { borderId: tmpBorder.id }))
									}
								}
							}
						}
					}
				}
			}
		}
	}

	updateLeaderboard() {
		const leaderboard = []
		for (const border of this.borders
			.filter((border) => border.active && border.alive)
			.sort((a, b) => b.score - a.score)
			.slice(0, config.leaderboardSize)) {
			leaderboard.push({ id: border.id, name: border.name, score: border.score })
		}

		this.server.sendAll({ type: "leaderboard", data: { leaderboard } })
	}
}

export default BorderManager
