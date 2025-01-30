import Tile from "./tile.js"

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

export default TileManager
