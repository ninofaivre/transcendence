import { getCookie, logedInFetchGetNoInfo, logedInFetchPostJSON } from './global.js'

if (!getCookie('access_token'))
	window.location.href = '/index.html'

// watch to async this later
let discussionList = await getAllDiscussions()
let userName = await getUserName()
let currDiscussion = undefined
let mutex = false

// await all initial promises
//let initialLoad = [ discussionList, userName ]
//await Promise.all(initialLoad)

renderDiscussionList()

async function wheelTrigger()
{
	if (mutex == true)
		return
	let tmp = document.getElementById('messages')
	if (tmp.scrollTop > 500 || currDiscussion === undefined || discussionList[currDiscussion].isComplete)
		return
	mutex = true
	//console.log("michel a scroll pour voir les anciens messages")
	const nMsg = 50
	let res = await logedInFetchPostJSON("/users/getnMessages", { discussionId: discussionList[currDiscussion].id, start: discussionList[currDiscussion].messages.length, n: nMsg })
	res = await res.json()
	if (res.length < nMsg)
		discussionList[currDiscussion].isComplete = true
	discussionList[currDiscussion].messages = res.concat(discussionList[currDiscussion].messages)
	let jk = tmp.scrollHeight
	renderOneDiscussion(currDiscussion)
	tmp.scrollTo(0, tmp.scrollHeight - jk)
	mutex = false
}

window.logout = async function ()
{
	await fetch('/auth/logout', { "method": "GET" })
	document.location.href = '/index.html'
}

window.testWebSocket = async function ()
{
	document.location.href = '/testWebSocket.html'
}

async function populateDiscussion(index)
{
	console.log("populate discussion")
	if (!discussionList[index].messages)
		discussionList[index].messages = []
	let res = await logedInFetchPostJSON("/users/getnMessages", { discussionId: discussionList[index].id, start: discussionList[index].messages.length, n: 50 })
	res = await res.json()
	discussionList[index].messages = discussionList[index].messages.concat(res)
}

async function renderOneDiscussion(index)
{
	let HTMLDiscussionBox = document.getElementById('messagesUl')
	HTMLDiscussionBox.innerHTML = ""
	for (let msg of discussionList[index]["messages"])
	{
		let li = document.createElement("li")
		li.innerHTML = `<b>${msg.from}</b>` + `&nbsp`.repeat(4) + `${msg.content}`
		HTMLDiscussionBox.appendChild(li)
	}
}

window.createMessage = async function ()
{
	if (currDiscussion === undefined)
	{
		console.log("no discussion selected")
		return
	}
	const res = await logedInFetchPostJSON("/users/createMessage", { discussionId: discussionList[currDiscussion].id, content: document.forms["createMessageForm"]["msg"].value })
	if (res.status != 201)
		console.log('failed to create message')
	document.forms["createMessageForm"]["msg"].value = ""
}

window.setCurrDiscussion = async function (index)
{
	currDiscussion = index
	if (!discussionList[index].messages)
		await populateDiscussion(index)
	renderOneDiscussion(index)
	const msgBox = document.getElementById("messages")
	msgBox.scrollTo(0, msgBox.scrollTopMax)
}

async function renderDiscussionList()
{
	let HTMLDiscussionList = document.getElementById("discussionsList")
	HTMLDiscussionList.innerHTML = ""
	let index = 0
	for (let currDiscussion of discussionList)
	{
		// prevent logged user from being showed in the name list of each discussion
		currDiscussion.users = currDiscussion.users.filter(e => e!==userName)
		let li = document.createElement("li")
		let button = document.createElement("button")
		button.setAttribute("onClick", `setCurrDiscussion(${index})`)
		button.appendChild(document.createTextNode(currDiscussion.users.join()))
		li.appendChild(button)
		HTMLDiscussionList.appendChild(li)
		index++
	}
}

async function getUserName()
{
	return (await logedInFetchGetNoInfo('/users/myName')).data
}

async function getAllDiscussions ()
{
	return logedInFetchGetNoInfo('/users/getAllDiscussions')
}

window.createDiscussion = async function ()
{
	const res = await logedInFetchPostJSON("/users/createDiscussion", { users: document.forms["createDiscussionForm"]["name"].value.split(' ') })
	if (res.status != 201)
	{
		console.log(`can't create discussion : status : ${res.status}`)
		return
	}
}

const update = new EventSource('http://88.172.94.204:49153/users/sse');

update.onmessage = ({ data }) =>
{
	const parsedData = JSON.parse(data)
	if (!parsedData.test["discussions"].length && !parsedData.test["messages"])
		return
	if (parsedData.test["discussions"].length)
	{
		for (let i of parsedData.test["discussions"])
			discussionList.push(i)
		renderDiscussionList()
	}
	if (parsedData.test["messages"].length)
	{
		let msgBox = document.getElementById("messages")
		let jk = msgBox.scrollTopMax - msgBox.scrollTop
		for (let msg of parsedData.test["messages"])
		{
			discussionList.find(item => item.id === msg.discussionId)["messages"].push(msg)
			if (msg.discussionId === discussionList[currDiscussion].id)
				renderOneDiscussion(currDiscussion)
		}
		if (jk == 0)
			msgBox.scrollTo(0, msgBox.scrollTopMax)
	}
}


addEventListener('wheel', (event) => {});

onwheel = async (event) => { await wheelTrigger() };
