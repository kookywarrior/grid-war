import BorderManager from "./borderManager.js"
import { gameCanvasResize, renderFrame } from "./render.js"
import { getValue, storeValue } from "./storage.js"
import TileManager from "./tileManager.js"
import config from "./config.js"
import util from "./util.js"
import { borderDeath, showContainer, showTitle, spawnBorder, successfullySpawnBorder, updateLeaderboard } from "./dom.js"
import Tutorial from "./tutorial.js"

document.addEventListener("DOMContentLoaded", loadGame)

async function loadGame() {
	showTitle()

	const tileManager = new TileManager()
	const borderManager = new BorderManager()

	// prepare background
	borderManager.spawnBorder("b", null, config.mapSize / 2, config.mapSize / 2 - 2, 0)
	borderManager.spawnBorder("a", null, config.mapSize / 2 - 4, config.mapSize / 2 - 2, 0)
	const weightedArray = util.createWeightArray([1024, 512, 256, 128, 64, 32, 16, 8, 4, 2])
	Array.from(["a", "b"]).forEach((borderId) => {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (Math.random() < 0.6) {
					const value = weightedArray[Math.floor(Math.random() * weightedArray.length)]
					tileManager.addTile(tileManager.tiles.length + 1, value, i, j, borderId, false, [])
				}
			}
		}
	})

	window.VARIABLES = {
		graphicsQuality: "Normal",
		name: "",
		tutorial: false
	}
	const lastPing = []

	window.sendMovement = () => {}

	let keydown = {}
	window.onkeydown = (event) => {
		if (event.code === "Escape") {
			event.event.preventDefault()
		}

		if (window.myBorder == null || !window.myBorder.active) return

		keydown[event.code] = true

		if (event.code === "KeyA" || event.code === "ArrowLeft") {
			window.sendMovement("left")
		} else if (event.code === "KeyD" || event.code === "ArrowRight") {
			window.sendMovement("right")
		} else if (event.code === "KeyW" || event.code === "ArrowUp") {
			window.sendMovement("top")
		} else if (event.code === "KeyS" || event.code === "ArrowDown") {
			window.sendMovement("bottom")
		}
	}

	window.onkeypress = (event) => {
		if (event.code === "Escape") {
			event.preventDefault()
		}
	}

	window.onkeyup = (event) => {
		if (event.code === "Escape") {
			event.preventDefault()
		}
		keydown[event.code] = false
	}

	let startX = 0
	let startY = 0
	window.ontouchstart = (event) => {
		startX = event.touches[0].clientX
		startY = event.touches[0].clientY
	}
	window.ontouchend = (event) => {
		const diffX = event.changedTouches[0].clientX - startX
		const diffY = event.changedTouches[0].clientY - startY
		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > config.touchThreshold) {
				window.sendMovement("right")
			} else if (diffX < -config.touchThreshold) {
				window.sendMovement("left")
			}
		} else {
			if (diffY > config.touchThreshold) {
				window.sendMovement("bottom")
			} else if (diffY < -config.touchThreshold) {
				window.sendMovement("top")
			}
		}
	}

	let tmpStorage = getValue("graphicsQuality")
	if (tmpStorage) {
		window.VARIABLES.graphicsQuality = tmpStorage
	}

	function changeGraphicsQuality() {
		const qualities = ["Potato", "Low", "Normal", "High", "Best"]
		window.VARIABLES.graphicsQuality = util.nextElement(qualities, window.VARIABLES.graphicsQuality)
		storeValue("graphicsQuality", window.VARIABLES.graphicsQuality)
		document.getElementById("qualitySettings").textContent = `Quality: ${window.VARIABLES.graphicsQuality}`
	}
	document.getElementById("qualitySettings").textContent = `Quality: ${window.VARIABLES.graphicsQuality}`
	document.getElementById("qualitySettings").onclick = changeGraphicsQuality

	window.onresize = () => {
		gameCanvasResize(window.VARIABLES.graphicsQuality)
	}
	gameCanvasResize(window.VARIABLES.graphicsQuality)

	tmpStorage = getValue("name")
	if (tmpStorage) {
		window.VARIABLES.name = tmpStorage
	}
	document.getElementById("inputName").value = window.VARIABLES.name

	document.getElementById("tutorial").onclick = () => {
		new Tutorial(borderManager, tileManager, handleMessages)
	}

	document.getElementById("fullScreenButton").addEventListener("click", async () => {
		if (document.fullscreenElement) {
			await document.exitFullscreen()
		} else {
			await document.documentElement.requestFullscreen()
		}
	})

	document.addEventListener("fullscreenchange", (event) => {
		if (document.fullscreenElement) {
			document.getElementById("fullScreenButton").innerHTML = "&#xE5D1;"
		} else {
			document.getElementById("fullScreenButton").innerHTML = "&#xE5D0;"
		}
	})

	window.ws = new WebSocket("wss://gridwar-kookywarrior.ladeapp.com/")
	// window.ws = new WebSocket("ws://localhost:3000/")
	window.ws.binaryType = "arraybuffer"
	window.ws.onopen = () => {
		window.ws.iosend = (data) => {
			window.ws.send(window.msgpack.encode(data))
		}

		window.ws.iosend({ type: "ping" })
		lastPing.push(new Date())
		const interval = setInterval(() => {
			if (window.ws.readyState !== WebSocket.OPEN) {
				clearInterval(interval)
				return
			}
			window.ws.iosend({ type: "ping" })
			lastPing.push(new Date())
		}, 3000)
		window.ws.onmessage = (event) => {
			try {
				const { type, data } = window.msgpack.decode(new Uint8Array(event.data))
				handleMessages(type, data)
			} catch (error) {
				console.error(error)
			}
		}

		window.sendMovement = (direction) => {
			window.ws.iosend({ type: "move", data: { direction: direction } })
		}

		window.ws.onclose = () => {
			clearInterval(interval)
			window.onbeforeunload = null
			if (!window.VARIABLES.tutorial) {
				showContainer("disconnectContainer")
			}
		}
	}

	function handleMessages(type, data) {
		if (type === "pong") {
			const ping = new Date() - lastPing[0]
			lastPing.shift()
			document.getElementById("pingDisplay").textContent = `Ping: ${ping} ms`
		} else if (type === "connected") {
			window.myId = data.id
			showContainer("spawnContainer")
		} else if (type === "score") {
			if (window.myBorder != null) {
				window.myBorder.updateScore(data.score)
			}
		} else if (type === "leaderboard") {
			updateLeaderboard(data.leaderboard)
		} else if (type === "invalidMove") {
			if (window.myBorder != null) {
				window.myBorder.shake(data.direction)
			}
		} else if (type === "addBorder") {
			const border = borderManager.spawnBorder(data.id, data.name, data.x, data.y, data.score)
			if (data.id === window.myId) {
				window.myBorder = border
				border.updateScore(data.score)
				const cameraBorder = {
					x: window.myBorder.x + config.borderSize / 2,
					y: window.myBorder.y + config.borderSize / 2
				}
				window.camera = {
					x: cameraBorder.x,
					y: cameraBorder.y
				}
				keydown = {}
				successfullySpawnBorder(data.noUi)
			}
		} else if (type === "removeBorder") {
			borderManager.removeBorder(data.id)
		} else if (type === "killBorder") {
			borderManager.killBorder(data.id)
			if (data.id === window.myId) {
				borderDeath()
			}
		} else if (type === "updateBorder" || type === "slideBorder") {
			borderManager.updateBorder(data.id, data.x, data.y, type === "slideBorder")
		} else if (type === "addTile" || type === "showTile") {
			tileManager.addTile(data.sid, data.value, data.x, data.y, data.borderId, type === "showTile", [])
		} else if (type === "removeTile") {
			tileManager.removeTile(data.sid)
		} else if (type === "updateTile" || type === "slideTile") {
			tileManager.updateTile(data.sid, data.x, data.y, type === "slideTile")
		} else if (type === "mergeTile") {
			tileManager.mergeTile(data.sid1, data.sid2, data.merge, data.value, data.x, data.y, data.borderId)
		}
	}

	window.iosend = window.ws.iosend

	let elapsedTime = 0
	const times = []
	function updateGame() {
		const now = performance.now()
		while (times.length > 0 && times[0] <= now - 1000) {
			times.shift()
		}
		times.push(now)
		elapsedTime += times.length
		if (elapsedTime > 2000) {
			elapsedTime = 0
			document.getElementById("fpsDisplay").textContent = `FPS: ${times.length}`
		}
		renderFrame(borderManager.borders, tileManager.tiles)
		window.requestAnimationFrame(updateGame)
	}
	window.requestAnimationFrame(updateGame)

	let init = false
	document.getElementById("playButton").onclick = () => {
		storeValue("name", document.getElementById("inputName").value)
		if (!init) {
			init = true
			tileManager.tiles = []
			borderManager.borders = []
			window.onbeforeunload = function (e) {
				return "Are you sure?"
			}
		}
		spawnBorder()
	}
}
