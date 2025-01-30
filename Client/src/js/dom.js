import config from "./config.js"
import util from "./util.js"

function showTitle() {
	const letterPixels = Array.from(document.getElementsByClassName("letterpixel"))
	util.shuffleArray(letterPixels)
	letterPixels.forEach((ele) => {
		const bgLightness = 100 - util.randomInteger(6, 11) * 8
		ele.style.backgroundColor = `hsl(${Math.random() < 0.5 ? 200 : 0}, 50%, ${bgLightness}%)`
		if (ele.classList.contains("lettershow")) {
			ele.classList.remove("lettershow")
		}
		setTimeout(() => {
			ele.classList.add("lettershow")
		}, util.randomInteger(0, 1000))
	})
}

function borderDeath() {
	document.getElementById("uiContainer").style.display = "none"

	document.getElementById("diedText").style.display = "none"
	document.getElementById("diedText").style.display = null

	setTimeout(() => {
		document.getElementById("diedText").style.display = "none"

		if (!document.getElementById("menuContainer").classList.contains("menuOpacity")) {
			document.getElementById("menuContainer").classList.add("menuOpacity")
		}
		showTitle()
	}, config.deathFadeout)
}

function spawnBorder() {
	showContainer("loadingContainer")
	window.ws.iosend({ type: "spawn", data: { name: document.getElementById("inputName").value } })
}

function successfullySpawnBorder(noUi = false) {
	if (noUi) {
		document.getElementById("tutorialContainer").style.display = null
	} else {
		document.getElementById("uiContainer").style.display = null
	}
	document.getElementById("menuContainer").classList.remove("menuOpacity")
	showContainer("spawnContainer")
}

function showContainer(container) {
	document.getElementById("spawnContainer").style.display = "none"
	document.getElementById("loadingContainer").style.display = "none"
	document.getElementById("disconnectContainer").style.display = "none"
	document.getElementById(container).style.display = null
}

function updateLeaderboard(data) {
	const leaderboardData = document.getElementById("leaderboardData")
	while (leaderboardData.hasChildNodes()) {
		leaderboardData.removeChild(leaderboardData.lastChild)
	}

	for (let i = 0; i < data.length; i++) {
		const tmpData = data[i]
		const leaderHolder = document.createElement("div")
		leaderHolder.classList.add("leaderHolder")

		const leaderboardItem = document.createElement("div")
		leaderboardItem.classList.add("leaderboardItem")
		leaderboardItem.style.color = tmpData.id === window.myId ? "white" : "lightgray"
		leaderboardItem.textContent = `${i + 1}. ${tmpData.name}`
		leaderHolder.appendChild(leaderboardItem)

		const leaderScore = document.createElement("div")
		leaderScore.classList.add("leaderScore")
		leaderScore.textContent = util.kFormat(tmpData.score)
		leaderHolder.appendChild(leaderScore)

		leaderboardData.appendChild(leaderHolder)
	}
}

export { showTitle, borderDeath, spawnBorder, successfullySpawnBorder, showContainer, updateLeaderboard }
