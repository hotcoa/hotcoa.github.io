const baseUrl = "https://message-list.appspot.com";
const messageUrl = `${baseUrl}/messages`;
const database = []; // database to cache messages
let pageToken; // indicates if there are more messages to retrieve

let topSentinelPreviousY = 0;
let topSentinelPreviousRatio = 0;
let bottomSentinelPreviousY = 0;
let bottomSentinelPreviousRatio = 0;
let listSize = 20;
let currentIndex = 0;
let touchStartX, touchEndX, touchStartY, touchEndY;
let swipeThreshold;

const timeunit = {
  sec: 1000,
  min: 60*1000,
  hr: 60*60*1000,
  day: 24*60*60*1000,
  month: 30*24*60*60*1000, // for simplicity, assume there are 30 days in a month
  year: 365*24*60*60*1000,
}

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

/* 
* Fetch messages and cache them
*/
function getMessages(nextToken, limit) {
  let params;
  if (nextToken) {
    params = `pageToken=${nextToken}`;
  }

  if (limit) {
    params = params ? `${params}&limit=${limit}` : `limit=${limit}`;
  }

  const mUrl = params? `${messageUrl}?${params}` : messageUrl;

  return $.get(mUrl, function(data) {
    pageToken = data.pageToken;
    data.messages.forEach(item => {
      // calculate updated time of message
      let updateTime = new Date(item.updated);
      let timediff = Date.now() - updateTime;
      let displayTime;
      switch (true) {
        case (timediff > timeunit.year):
          displayTime = Math.floor(timediff/timeunit.year);
          displayTime += (displayTime === 1) ? " year ago" : " years ago";
          break;
        case (timediff > timeunit.month):
          displayTime = Math.floor(timediff/timeunit.month);
          displayTime += (displayTime === 1) ? " month ago" : " months ago";
          break;
        case (timediff > timeunit.day):
          displayTime = Math.floor(timediff/timeunit.day);
          displayTime += (displayTime === 1) ? " day ago" : " days ago";
          break;
        case (timediff > timeunit.hr):
          displayTime = Math.floor(timediff/timeunit.hr);
          displayTime += (displayTime === 1) ? " hour ago" : " hours ago";
          break;
        case (timediff > timeunit.min):
          displayTime = Math.floor(timediff/timeunit.min);
          displayTime += (displayTime === 1) ? " minute ago" : " minutes ago";
          break;
        default:
          displayTime = Math.floor(timediff/timeunit.sec);
          if (displayTime === 0) {
            displayTime = "1 second ago";
          } else {
            displayTime += (displayTime === 1) ? " second ago" : " seconds ago";
          }
          break;
      }

      // cache the message
      database.push({
        id: item.id,
        content: item.content,
        updateTime: displayTime,
        name: item.author.name,
        photoUrl: baseUrl + item.author.photoUrl
      });
    });
  }); 
}

/*
* Initialize message list
*/
function initializeList(num) {
  const container = document.querySelector("#message-list");
  for (let i = 0; i < Math.min(num, database.length); i++) {
    const tile = document.createElement("LI");
      
    // set attribute for LI elem
    tile.setAttribute("data-msgId", database[i].id);
    tile.setAttribute("data-tileId", i);
    tile.setAttribute("class", "tile");
    tile.setAttribute("id", "tile-" + i);

    // create header elem
    const header = document.createElement("DIV");
    header.setAttribute("class", "header");
    const authorImg = document.createElement("IMG");
    authorImg.setAttribute("src", database[i].photoUrl);    
    const meta = document.createElement("DIV");
    meta.setAttribute("class", "meta");
    const authorName = document.createElement("P");
    authorName.setAttribute("class", "author-name");
    const updateTime = document.createElement("P");
    updateTime.setAttribute("class", "update-time");
    authorName.innerHTML = database[i].name;
    updateTime.innerHTML = database[i].updateTime;
    meta.appendChild(authorName);
    meta.appendChild(updateTime);
    header.appendChild(authorImg);
    header.appendChild(meta);

    // create message elem
    const msg = document.createElement("DIV");
    msg.setAttribute("class", "message");
    msg.innerHTML =  database[i].id + ': ' + database[i].content;
    tile.appendChild(header);
    tile.appendChild(msg); 
    container.appendChild(tile);

    // cache tile's height
    database[i].height = $(tile).outerHeight(true);
  }
}

function getSlidingWindowIdx(isScrollDown) {
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

function recycleDOM(firstIndex, isScrollDown) {
  if (isScrollDown && (database.length < (firstIndex + listSize))) {
	  getMessages(pageToken, listSize).then(() => {
      recycleTile(firstIndex);
      let containerElem = document.getElementById("container");
      containerElem.style.visibility = "visible";
    });
  } else {
    recycleTile(firstIndex);
    let containerElem = document.getElementById("container");
    containerElem.style.visibility = "visible";
  }
}

function recycleTile(firstIndex) {
  for (let i = 0; i < listSize; i++) {
    const idx = i + firstIndex;
    const tile = document.querySelector("#tile-" + i);

    /* Update message tile */
    if (idx < database.length) {
      updateTile(i, idx);
    } else {
      tile.style.display = 'none';
    }
  }
}

const adjustContainerPaddings = (isScrollDown, firstIdx) => {
	const container = document.querySelector("#message-list");
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  let remPaddingsVal = 0;
  
  if (isScrollDown) {
    firstIdx -= listSize/2;
    for (let i = 0; i < listSize/2; i++) {
      const tile = document.querySelector("#tile-" + i);
      database[i+firstIdx].height = $(tile).outerHeight(true);
      remPaddingsVal += database[i+firstIdx].height;
    }
  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";    
  } else {
    for (let i = 0; i < listSize/2; i++) {
      const idx = i + firstIdx;
      remPaddingsVal += database[idx].height;
    }
    container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";
  }
}


/***********************************/
/* Intersection observer callbacks */
/***********************************/

function topSentinentalCallback(entry) {
	if (currentIndex === 0) {
		const container = document.querySelector("#message-list");
  	container.style.paddingTop = "0px";
  	container.style.paddingBottom = "0px";
  }

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;

  if (currentY > topSentinelPreviousY &&
    isIntersecting &&
    currentRatio >= topSentinelPreviousRatio &&
    currentIndex !== 0
  ) {
    const firstIndex = getSlidingWindowIdx(false);
    let containerElem = document.getElementById("container");
    containerElem.style.visibility = "hidden";
    adjustContainerPaddings(false, firstIndex);
    recycleDOM(firstIndex, false);
    //containerElem.style.visibility = "visible";
    currentIndex = firstIndex;
  }

  topSentinelPreviousY = currentY;
  topSentinelPreviousRatio = currentRatio;
}

function botSentinentalCallback(entry) {  
	if (!pageToken) {
  	return;
  }

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;

  if (currentY < bottomSentinelPreviousY &&
    currentRatio > bottomSentinelPreviousRatio &&
    isIntersecting
  ) {
    const firstIndex = getSlidingWindowIdx(true);
    let containerElem = document.getElementById("container");
    containerElem.style.visibility = "hidden";
    adjustContainerPaddings(true, firstIndex);
    recycleDOM(firstIndex, true); 
    //containerElem.style.visibility = "visible";   
    currentIndex = firstIndex;
  }

  bottomSentinelPreviousY = currentY;
  bottomSentinelPreviousRatio = currentRatio;
}

function initIntersectionObserver() {
  const options = {
    rootMargin: '200px'
  }

  const callback = entries => {
    entries.forEach(entry => {
      if (entry.target.id === 'tile-0') {
        topSentinentalCallback(entry);
      } else if (entry.target.id === `tile-${listSize - 1}`) {
        botSentinentalCallback(entry);
      }
    });
  }

  var observer = new IntersectionObserver(callback, options);
  observer.observe(document.querySelector("#tile-0"));
  observer.observe(document.querySelector(`#tile-${listSize - 1}`));
}  

/*********************************/
/* Touch event handlers */
/*********************************/

function handleTouchStart(evt) {
  const firstTouch = (evt.touches || evt.originalEvent.touches[0])[0];
  touchStartX = firstTouch.clientX;
  touchStartY = firstTouch.clientY;
};                                                

function handleTouchMove(evt) {
  const tile = evt.target.closest("LI");
  let x, y;


  if (tile && tile.className === "tile") {
    x = evt.touches[0].clientX;
    y = evt.touches[0].clientY;
    
    // check if proper horizontal swipe has started
    if (!touchEndX && !touchEndY) {
      tile.style.transition = "transform 10ms, opacity 200ms";
      let xDiff = x - touchStartX;
      let yDiff = y - touchStartY;

      if (xDiff > 0 && Math.abs(xDiff) > Math.abs(yDiff)) {
        touchEndX = x;
        touchEndY = y;
      }
    } else {
      let xDiff = x - touchStartX;
      let yDiff = y - touchStartY;
      touchEndX = x;
      touchEndY = y;

      if (xDiff > 0) {
        if (xDiff <= swipeThreshold) {
          tile.style.opacity = "0.68";
        } else {
          tile.style.opacity = "0.28";
        }        
        tile.style.transform = "translateX(" + xDiff + "px)";      
      } else if (xDiff <= 0) {
        tile.style.opacity = "1";
        tile.style.transform = "translateX(0px)";
      }
    }
  }
}

function handleTouchEnd(evt) {
  const tile = evt.target.closest("LI");

  if (tile && tile.className === "tile") {
    var xDiff = touchEndX - touchStartX;
    var yDiff = touchEndY - touchStartY;
    tile.style.transition = "transform 200ms";
    
    if (xDiff > swipeThreshold) {
      tile.style.transform = "translateX(150%)";

      // Wait until the above transition is finished
      setTimeout(function () {
        removeTile(tile);
        
        // reset the tile's style
        tile.style.transition = "";
        tile.style.transform = "translateX(0)";        
        tile.style.opacity = "1";  
      }, 200);
    } else {
      tile.style.opacity = "1";
      tile.style.transform = "translateX(0px)";
    }
  }
  
  touchEndX = null;
  touchStartX = null;
  touchEndY = null;
  touchStartY = null;  
}

/*********************************/
/* Tile updates */
/*********************************/

function removeTile(tileToRemove) {
  // remove the elem from database
  let msgId = parseInt(tileToRemove.dataset.msgid);
  let dbIdx = database.findIndex((dbelem) => (dbelem.id === msgId));    
  database.splice(dbIdx, 1);

  let tileId = parseInt(tileToRemove.dataset.tileid);
  let fetchMore = false;
  let startAfterFetchIdx = 0;
  // re-render the remaining part
  for (let i=0; i<listSize-tileId; i++) {
      let dbIndexToFetch = dbIdx + i;

      /* Update message tile */
      if (dbIndexToFetch < database.length) {
        updateTile(tileId + i, dbIndexToFetch);
      } else {
        if (pageToken) {
          fetchMore = true;
          startAfterFetchIdx = i;
          break;
        }            
      }        
  }

  if (fetchMore) {
    getMessages(pageToken, listSize).then(() => {
      for (let j=startAfterFetchIdx; j<listSize-tileId; j++) {
        updateTile(tileId + j, dbIdx + j);
      }
    });
  }
}

function updateTile(tileIdToUpdate, dbIndexToFetch) {
  const tile = document.querySelector("#tile-" + tileIdToUpdate);
  tile.setAttribute("data-msgId", database[dbIndexToFetch].id);
  const header = tile.getElementsByClassName("header")[0];
  header.getElementsByTagName("IMG")[0].setAttribute("src", database[dbIndexToFetch].photoUrl);
  const meta = header.getElementsByClassName("meta")[0];
  meta.getElementsByClassName("author-name")[0].innerHTML = database[dbIndexToFetch].name;
  meta.getElementsByClassName("update-time")[0].innerHTML = database[dbIndexToFetch].updateTime;
  tile.getElementsByClassName("message")[0].innerHTML = database[dbIndexToFetch].id + ': ' + database[dbIndexToFetch].content;
}

/*********************************/
/* Start point */
/*********************************/
window.onload = function() {
  var touchsurface = document.getElementById('container');
  touchsurface.addEventListener('touchstart', handleTouchStart, false);
  touchsurface.addEventListener('touchmove', handleTouchMove, false);
  touchsurface.addEventListener('touchend', handleTouchEnd, false);

  // ! add value
  touchsurface.style.marginTop = $("#topheader").outerHeight(true) + 'px';

  var currDate = new Date();
  var hourMinFormat = currDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  document.getElementById("header-time").innerHTML = hourMinFormat;
  swipeThreshold = $('#message-list').width() * 0.6;

  getMessages(pageToken, 20).then(() => {
    initializeList(listSize);
    initIntersectionObserver();
  });
}

