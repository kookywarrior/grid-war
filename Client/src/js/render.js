import config from "./config.js"
import util from "./util.js"

const mainCanvas = document.getElementById("gameCanvas")
const mainContext = mainCanvas.getContext("2d")
const mapCanvas = document.getElementById("minimap")
const mapContext = mapCanvas.getContext("2d")

function gameCanvasResize(graphicsQuality) {
	let graphics = 100
	if (graphicsQuality === "Potato") {
		graphics = 50
	} else if (graphicsQuality === "Low") {
		graphics = 75
	} else if (graphicsQuality === "Normal") {
		graphics = 100
	} else if (graphicsQuality === "High") {
		graphics = 125
	} else if (graphicsQuality === "Best") {
		graphics = 150
	}

	const pixelQuality = graphics / 100
	window.scaleFillNative = Math.max(window.innerWidth / config.sightWidth, window.innerHeight / config.sightHeight) * pixelQuality
	mainCanvas.width = window.innerWidth * pixelQuality
	mainCanvas.height = window.innerHeight * pixelQuality
	mainCanvas.style.width = window.innerWidth + "px"
	mainCanvas.style.height = window.innerHeight + "px"
	mainContext.setTransform(
		window.scaleFillNative,
		0,
		0,
		window.scaleFillNative,
		(window.innerWidth * pixelQuality - config.sightWidth * window.scaleFillNative) / 2,
		(window.innerHeight * pixelQuality - config.sightHeight * window.scaleFillNative) / 2
	)
}

let timeNow = Date.now(),
	timeDelta = 0,
	timeLast = timeNow,
	offset = {}
window.camera = {
	x: config.mapSize / 2,
	y: config.mapSize / 2
}
function renderFrame(borders, tiles) {
	timeNow = Date.now()
	timeDelta = timeNow - timeLast
	timeLast = timeNow

	// Move Camera & Increment Score
	if (window.myBorder != null) {
		const cameraBorder = {
			x: window.myBorder.x + config.borderSize / 2,
			y: window.myBorder.y + config.borderSize / 2
		}
		const tmpDist = util.getDistance(window.camera.x, window.camera.y, cameraBorder.x, cameraBorder.y)
		const camSpeed = Math.min(tmpDist * 0.01 * timeDelta, tmpDist)
		if (tmpDist > 0.05) {
			const tmpDir = util.getDirection(cameraBorder.x, cameraBorder.y, window.camera.x, window.camera.y)
			window.camera.x += camSpeed * Math.cos(tmpDir)
			window.camera.y += camSpeed * Math.sin(tmpDir)
		} else {
			window.camera = {
				x: cameraBorder.x,
				y: cameraBorder.y
			}
		}

		if (window.myBorder.wiggle !== 0) {
			if (window.myBorder.wiggle < 0.01) {
				window.myBorder.wiggle = 0
			} else {
				window.myBorder.wiggle *= Math.pow(0.99, timeDelta)
			}
		}

		if (window.myBorder.score !== window.myBorder.targetScore) {
			if (window.myBorder.score < window.myBorder.targetScore) {
				window.myBorder.score++
			} else {
				window.myBorder.score--
			}
			document.getElementById("scoreDisplay").textContent = "Score: " + window.myBorder.score
		}
	} else {
		window.camera = {
			x: config.mapSize / 2,
			y: config.mapSize / 2
		}
	}

	// Interpolate Borders
	for (const border of borders) {
		if (border.active && border.alive && (border.x !== border.x2 || border.y !== border.y2)) {
			if (border.startTime === null) {
				border.startTime = timeNow
			}

			const elapsedTime = timeNow - border.startTime
			let t = elapsedTime / config.slideAnimationDuration
			if (t >= 1) {
				t = 1
			}

			border.x = border.x1 + (border.x2 - border.x1) * easeInOut(t)
			border.y = border.y1 + (border.y2 - border.y1) * easeInOut(t)

			if (t === 1) {
				border.startTime = null
				border.x = border.x2
				border.y = border.y2
			}
		}
	}

	// Interpolate Tiles
	for (const tile of tiles) {
		if (tile.active) {
			if (tile.x !== tile.x2 || tile.y !== tile.y2) {
				if (tile.startTime === null) {
					tile.startTime = timeNow
				}

				const elapsedTime = timeNow - tile.startTime
				let t = elapsedTime / config.slideAnimationDuration
				if (t >= 1) {
					t = 1
				}

				tile.x = tile.x1 + (tile.x2 - tile.x1) * easeInOut(t)
				tile.y = tile.y1 + (tile.y2 - tile.y1) * easeInOut(t)

				if (t === 1) {
					tile.startTime = null
					tile.x = tile.x2
					tile.y = tile.y2
				}
			}

			if (tile.scale !== 1) {
				if (tile.scaleStartTime === null) {
					tile.scaleStartTime = timeNow
				}

				const elapsedTime = timeNow - tile.scaleStartTime
				let t = elapsedTime / config.showAnimationDuration
				if (t >= 1) {
					t = 1
				}

				tile.scale = ease(t)

				if (t === 1) {
					tile.scaleStartTime = null
					tile.scale = 1
				}
			}

			if ((typeof tile.sid !== "string" && tile.opacity !== 1) || (typeof tile.sid === "string" && tile.opacity !== 0)) {
				if (tile.opacityStartTime === null) {
					tile.opacityStartTime = timeNow
				}

				const elapsedTime = timeNow - tile.opacityStartTime
				let t = elapsedTime / config.showAnimationDuration
				if (t >= 1) {
					t = 1
				}

				tile.opacity = typeof tile.sid === "string" ? 1 - ease(t) : ease(t)

				if (t === 1) {
					tile.opacityStartTime = null
					tile.opacity = typeof tile.sid === "string" ? 0 : 1
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
					if (typeof tile.sid === "string") {
						tile.active = false
					}
				}
			}

			if (tile.borderId && tile.border == null) {
				for (const border of borders) {
					if (border.id === tile.borderId) {
						tile.border = border
						break
					}
				}
			}
		}
	}

	offset = {
		x: window.camera.x - config.sightWidth / 2,
		y: window.camera.y - config.sightHeight / 2
	}

	// Render Background
	mainContext.globalAlpha = 1
	mainContext.fillStyle = "rgb(50, 50, 50)"
	mainContext.fillRect(0, 0, config.sightWidth, config.sightHeight)

	// Render Border
	mainContext.globalAlpha = 1
	mainContext.fillStyle = "gray"
	mainContext.shadowBlur = config.shadowSize * window.scaleFillNative
	for (const border of borders) {
		if (border.active && border.alive && border.id !== window.myId) {
			const x = border.x + border.wiggle * border.xWiggle - offset.x + 0.05
			const y = border.y + border.wiggle * border.yWiggle - offset.y + 0.05
			const width = border.width - 0.1
			const height = border.height - 0.1
			if (isOnScreen(x, y, width, height)) {
				mainContext.shadowColor = border.id === "a" ? "hsl(180, 100%, 80%)" : "hsl(0, 100%, 80%)"
				mainContext.fillRect(x, y, width, height)
			}
		}
	}
	if (window.myBorder != null && window.myBorder.active && window.myBorder.alive) {
		const x = window.myBorder.x + window.myBorder.wiggle * window.myBorder.xWiggle - offset.x + 0.05
		const y = window.myBorder.y + window.myBorder.wiggle * window.myBorder.yWiggle - offset.y + 0.05
		const width = window.myBorder.width - 0.1
		const height = window.myBorder.height - 0.1
		if (isOnScreen(x, y, width, height)) {
			mainContext.shadowColor = "hsl(180, 100%, 80%)"
			mainContext.fillRect(x, y, width, height)
		}
	}
	mainContext.shadowBlur = 0

	// Render Tiles without mergedTiles
	for (const tile of tiles) {
		if (tile.active && tile.border && tile.mergedTiles.length === 0 && tile.opacity !== 0 && tile.scale !== 0) {
			renderTile(tile)
		}
	}

	// Render Tiles with mergedTiles
	for (const tile of tiles) {
		if (tile.active && tile.border && tile.mergedTiles.length === 2 && tile.opacity !== 0) {
			renderTile(tile)
		}
	}

	// Render Grids
	mainContext.lineWidth = 0.1
	mainContext.strokeStyle = "white"
	mainContext.globalAlpha = 0.1
	mainContext.beginPath()
	for (let x = 0; x < config.mapSize + 1; x++) {
		mainContext.moveTo(x - offset.x, 0 - 0.05 - offset.y)
		mainContext.lineTo(x - offset.x, config.mapSize + 0.05 - offset.y)
	}
	for (let y = 0; y < config.mapSize + 1; y++) {
		mainContext.moveTo(0 - offset.x, y - offset.y)
		mainContext.lineTo(config.mapSize - offset.x, y - offset.y)
	}
	mainContext.stroke()

	// Render Minimap
	if (window.myBorder != null) {
		mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height)
		mapContext.fillStyle = "#fff"
		mapContext.beginPath()
		mapContext.arc((window.myBorder.x / config.mapSize) * mapCanvas.width, (window.myBorder.y / config.mapSize) * mapCanvas.height, 4, 0, 2 * Math.PI)
		mapContext.fill()
	}
}

function renderTile(tile) {
	const x = tile.x + (tile.border.x + tile.border.wiggle * tile.border.xWiggle) - offset.x
	const y = tile.y + (tile.border.y + tile.border.wiggle * tile.border.yWiggle) - offset.y
	if (isOnScreen(x, y, config.tileSize, config.tileSize)) {
		mainContext.save()
		mainContext.globalAlpha = tile.opacity
		mainContext.translate(x, y)
		mainContext.translate(config.tileSize / 2, config.tileSize / 2)
		mainContext.scale(tile.scale, tile.scale)
		mainContext.translate(-config.tileSize / 2, -config.tileSize / 2)
		mainContext.fillStyle = tile.bgColour
		mainContext.fillRect(0.05, 0.05, config.tileSize - 0.1, config.tileSize - 0.1)
		mainContext.textBaseline = "middle"
		mainContext.textAlign = "center"
		mainContext.fillStyle = tile.textColour
		mainContext.font = `0.4px Bebas Neue`
		mainContext.fillText(tile.value, config.tileSize / 2, config.tileSize / 2 + 0.05)
		mainContext.restore()
	}
}

function ease(t) {
	// Cubic Bezier approximation of 'ease' (cubic-bezier(0.25, 0.1, 0.25, 1))
	return t * t * (3 - 2 * t)
}

function easeInOut(t) {
	if (t < 0.5) {
		return 2 * t * t // ease-in
	} else {
		return -1 + (4 - 2 * t) * t // ease-out
	}
}

function isOnScreen(x, y, width, height) {
	if (x + width < 0 || y + height < 0 || x > config.sightWidth || y > config.sightHeight) {
		return false
	}
	return true
}

export { gameCanvasResize, renderFrame }
