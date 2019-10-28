const baseUrl = "https://message-list.appspot.com";
const messageUrl = `${baseUrl}/messages`;
const database = []; // reserved word?
let pageToken;

let callCnt = 0;
const getMessages = (nextToken, limit) => {
  let params;
  if (nextToken) {
    params = `pageToken=${nextToken}`;
  }
  if (limit) {
    params = params ? `${params}&limit=${limit}` : `limit=${limit}`;
  }
  const mUrl = params? `${messageUrl}?${params}` : messageUrl;
  callCnt++;
  console.log(callCnt + ': getMessage is called: murl is ' + mUrl);
  return $.get(mUrl, function(data) {
    pageToken = data.pageToken;
    console.log('token is ' + pageToken);
    data.messages.forEach(item => {
      database.push({
        id: item.id,
        content: item.content,
        updated: item.updated,
        name: item.author.name,
        photoUrl: baseUrl + item.author.photoUrl
      });
    });
    console.log(database);
  }); 
}

let topSentinelPreviousY = 0;
let topSentinelPreviousRatio = 0;
let bottomSentinelPreviousY = 0;
let bottomSentinelPreviousRatio = 0;

let listSize = 20;
let currentIndex = 0;

const initList = num => {
	const container = document.querySelector(".cat-list");
  console.log('initList: ' + num);
  for (let i = 0; i < num; i++) {
    console.log(i);
  	const tile = document.createElement("LI");
    tile.setAttribute("class", "cat-tile");
    tile.setAttribute("id", "cat-tile-" + i);
    
    /*const img = document.createElement("IMG");
    img.setAttribute("src", database[i].photoUrl);
    tile.appendChild(img);
  	
    const title = document.createElement("DIV");
    const t = document.createTextNode(database[i].id + ': ' + database[i].content);
    title.appendChild(t);
    tile.appendChild(title);*/
    tile.innerHTML = database[i].id + ': ' + database[i].content;
    container.appendChild(tile);
  }
  
}

const getSlidingWindow = isScrollDown => {
	const increment = listSize / 2;
	let firstIndex;
  
  if (isScrollDown) {
  	firstIndex = currentIndex + increment;
  } else {
    firstIndex = currentIndex - increment;
  }
  
  if (firstIndex < 0) {
  	firstIndex = 0;
  }
  
  return firstIndex;
}

let cnt = 0;

const recycleDOM = (firstIndex, isScrollDown) => {
  console.log('first index is ' + firstIndex);
  const direction = isScrollDown ? "down" : "up";
  if (isScrollDown && (database.length < (firstIndex + listSize))) {
    // todo: call this only when this runs out of cache
	  getMessages(pageToken, 20).then(() => {
      for (let i = 0; i < listSize; i++) {
        const idx = i + firstIndex;
        const tile = document.querySelector("#cat-tile-" + i);
        console.log(`recycle ${direction} => idx: ${idx}, db id: ${database[idx].id}`);
        tile.innerHTML = database[idx].id + ': ' + database[idx].content;

        //tile.firstElementChild.innerHTML = database[idx].id + ': ' + database[idx].content;
        //tile.lastChild.setAttribute("src", database[idx].photoUrl);
        //console.log('innertext is ' + tile.firstElementChild.innerHTML);
      }
    });
  } else {
  	for (let i = 0; i < listSize; i++) {
        const idx = i + firstIndex;
        const tile = document.querySelector("#cat-tile-" + i);
        console.log(`recycle ${direction} => idx: ${idx}, db id: ${database[idx].id}`);
        tile.innerHTML = database[idx].id + ': ' + database[idx].content;

      //tile.lastChild.setAttribute("src", database[i + firstIndex].photoUrl);
    }
  }
}

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

const adjustPaddings = (isScrollDown, firstIdx) => {
	const container = document.querySelector(".cat-list");
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  let remPaddingsVal = 0;
  for (let i = 0; i < listSize/2; i++) {
      const tile = document.querySelector("#cat-tile-" + i);
      remPaddingsVal += tile.offsetHeight;
  }
  console.log('push down by ' + remPaddingsVal);
  
  if (isScrollDown) {
  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
//    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    
  } else {
    //container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
  	/*container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";*/
  }
}

const topSentCallback = entry => {
  console.log('topSentCallBack is called');
	if (currentIndex === 20) {
		const container = document.querySelector(".cat-list");
  	container.style.paddingTop = "0px";
  	container.style.paddingBottom = "0px";
  }

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;

  // conditional check for Scrolling up
  if (
    currentY > topSentinelPreviousY && // it means the top sentinel's y is growing
    isIntersecting &&
    currentRatio >= topSentinelPreviousRatio &&
    currentIndex !== 0
  ) {
    const firstIndex = getSlidingWindow(false);
    adjustPaddings(false);
    recycleDOM(firstIndex, false);
    currentIndex = firstIndex;
  }

  topSentinelPreviousY = currentY;
  topSentinelPreviousRatio = currentRatio;
}

const botSentCallback = entry => {
  console.log('botSentCallBack is called');
	if (!pageToken) { //DBSize - listSize) {
    console.log('botSentCallback just returned');
  	return;
  }
  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;
  console.log('botSentCallback got called');
  // conditional check for Scrolling down
  if (
    currentY < bottomSentinelPreviousY &&
    currentRatio > bottomSentinelPreviousRatio &&
    isIntersecting
  ) {
    const firstIndex = getSlidingWindow(true);
    adjustPaddings(true, firstIndex);
    recycleDOM(firstIndex, true);
    currentIndex = firstIndex;
  }

  bottomSentinelPreviousY = currentY;
  bottomSentinelPreviousRatio = currentRatio;
}

const initIntersectionObserver = () => {
  const options = {
  	/* root: document.querySelector(".cat-list") */
  }

  const callback = entries => {
    entries.forEach(entry => {
      if (entry.target.id === 'cat-tile-0') {
        topSentCallback(entry);
      } else if (entry.target.id === `cat-tile-${listSize - 1}`) {
        botSentCallback(entry);
      }
    });
  }

  var observer = new IntersectionObserver(callback, options);
  observer.observe(document.querySelector("#cat-tile-0"));
  observer.observe(document.querySelector(`#cat-tile-${listSize - 1}`));
}

getMessages(pageToken, 20).then(() => {
  initList(listSize);
  initIntersectionObserver();
});
