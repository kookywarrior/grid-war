import Tile from "./tile.js"
import util from "./util.js"

class TileManager {
	constructor() {
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

	addTile(sid, value, x, y, borderId, animate, mergedTiles) {
		let tile = this.findTile(sid)
		if (tile) {
		} else {
			for (const tmpTile of this.tiles) {
				if (!tmpTile.active) {
					tile = tmpTile
					tile.sid = sid
					break
				}
			}

			if (!tile) {
				tile = new Tile(sid)
				this.tiles.push(tile)
			}
		}
		tile.spawn(value, x, y, borderId, animate, mergedTiles)

		return tile
	}

	removeTile(sid) {
		const tile = this.findTile(sid)
		if (tile) {
			tile.active = false
			if (tile.mergedTiles.length === 2) {
				const tile1 = tile.mergedTiles[0]
				const tile2 = tile.mergedTiles[1]
				if (tile1.active) {
					tile1.active = false
				}
				if (tile2.active) {
					tile2.active = false
				}
				tile.mergedTiles = []
			}
		}
	}

	updateTile(sid, x, y, animate) {
		const tile = this.findTile(sid)
		if (tile) {
			tile.update(x, y, animate)
		}
	}

	mergeTile(sid1, sid2, merge, value, x, y, borderId) {
		const tile1 = this.findTile(sid1)
		const tile2 = this.findTile(sid2)
		let tmpTile1, tmpTile2
		if (tile1) {
			let sid
			while (true) {
				sid = util.randomString(16, "0123456789abcdef")
				if (!this.findTile(sid)) {
					break
				}
			}
			tmpTile1 = this.addTile(sid, tile1.value, tile1.x, tile1.y, tile1.borderId, false, [])
			tmpTile1.update(x, y, true)
			this.removeTile(tile1.sid)
		}
		if (tile2) {
			let sid
			while (true) {
				sid = util.randomString(16, "0123456789abcdef")
				if (!this.findTile(sid)) {
					break
				}
			}
			tmpTile2 = this.addTile(sid, tile2.value, tile2.x, tile2.y, tile2.borderId, false, [])
			tmpTile2.update(x, y, true)
			this.removeTile(tile2.sid)
		}

		if (merge != null) { 
			this.addTile(merge, value, x, y, borderId, false, [tmpTile1, tmpTile2])
		}
	}
}

export default TileManager
