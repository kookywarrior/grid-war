import express from "express"
import cors from "cors"
import { WebSocketServer } from "ws"
import { createServer } from "http"
import { encode, decode } from "msgpack-lite"
import util from "./src/util.js"
import config from "./src/config.js"
import BorderManager from "./src/borderManager.js"
import TileManager from "./src/tileManager.js"
import Bot from "./src/bot.js"

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const httpServer = createServer(app)
const server = new WebSocketServer({ server: httpServer })

const connections = {}
const tileManager = new TileManager(server)
const borderManager = new BorderManager(tileManager)

server.send = function (id, data) {
	if (connections[id] && !connections[id].isBot) {
		connections[id].send(new Uint8Array(encode(data)))
	}
}
server.sendAll = function (data, excludes = []) {
	for (const id in connections) {
		if (!excludes.includes(id)) {
			server.send(id, data)
		}
	}
}

const createDate = Date.now()
app.get("/creationDate", (req, res) => res.json({ date: createDate }))

server.on("connection", (conn, req) => {
	let id = null
	while (true) {
		id = util.randomString(20, config.idStrings)
		if (!connections[id]) {
			break
		}
	}
	conn.id = id
	connections[conn.id] = conn

	conn.on("message", (msg) => {
		try {
			const { type, data } = decode(new Uint8Array(msg))
			if (type === "ping") {
				server.send(conn.id, {
					type: "pong"
				})
			} else if (type === "spawn") {
				borderManager.spawnBorder(conn.id, data.name)
			} else if (type === "move") {
				if (Array.from(["left", "right", "top", "bottom"]).includes(data.direction)) {
					borderManager.queueMove(conn.id, data.direction)
				}
			}
		} catch (error) {
			console.log(error)
		}
	})

	conn.on("close", () => {
		borderManager.removeBorder(conn.id)
		delete connections[conn.id]
	})

	conn.on("error", (error) => {
		console.log(error)
	})

	server.send(conn.id, {
		type: "connected",
		data: {
			id: conn.id
		}
	})
})

const PORT = 4567
httpServer.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}/`)

	function addBot(rate) {
		let id = null
		while (true) {
			id = util.randomString(20, config.idStrings)
			if (!connections[id]) {
				break
			}
		}
		const bot = new Bot(id, borderManager, rate)
		connections[id] = bot
	}
	config.botsRate.forEach((rate) => addBot(rate))
})
